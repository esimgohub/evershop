/* eslint-disable camelcase */
// eslint-disable-next-line max-classes-per-file
const { select, insert } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const { createNewCart } = require('@evershop/evershop/src/modules/checkout/services/createNewCart');
const { setContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const smallestUnit = require('zero-decimal-currencies');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { makeRequest } = require('../../services/signature_generation');
const { calculateExpiry } = require('../../services/utils');
const { createOrder } = require('../../../checkoutApi/services/orderCreator');
const geoip = require('geoip-lite');
const { getOrdersBaseQuery } = require('@evershop/evershop/src/modules/oms/services/getOrdersBaseQuery');

const convertFromUSD = (amount, rate, currentIsoCode) => {
  if (currentIsoCode === 'USD') {
    return amount;
  }
  return amount * rate;
};

const generateTxnDescription = (items) => {
  const itemsDescription = items.map((item) => `${item.qty} x ${item.product_sku}\n`);
  return itemsDescription.join('');
};

// TODO:
// Custom error classes
class OrderCreationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OrderCreationError';
  }
}

class PaymentIntentCreationError extends Error {
  constructor(message, errorExtraParams) {
    super(message);
    this.name = 'PaymentIntentCreationError';
    this.errorExtraParams = { ...errorExtraParams };
  }
}

const parseIp = (req) =>
  req.headers['x-forwarded-for']?.split(',').shift()
  || req.socket?.remoteAddress;

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  try {
    let customerCountry = null;
    const ip = parseIp(request);
    if (ip) {
      const geo = geoip.lookup(ip);
      if (geo) {
        customerCountry = geo.country;
      }
    }

    info('IP====', ip);
    info('customerCountry====', customerCountry);

    const { cart_id, method_code } = request.body;

    const cart = await select()
      .from('cart')
      .where('uuid', '=', cart_id)
      .load(pool);
    let order = null;
    const query = getOrdersBaseQuery();
    query.where('cart_id', '=', cart.cart_id);
    order = await query.load(pool);

    if (!order) {
      // Verify cart
      const cart = await getCartByUUID(cart_id);
      if (!cart) {
        response.status(INVALID_PAYLOAD);
        response.json({
          error: {
            message: 'Invalid cart',
            status: INVALID_PAYLOAD
          }
        });
        return;
      } else if (cart.hasError()) {
        const errors = cart.getErrors();
        response.status(INVALID_PAYLOAD);
        response.json({
          error: {
            message: Object.values(errors)[0],
            status: INVALID_PAYLOAD
          }
        });
        return;
      }

      // Default address for cart
      const address = {
        address_1: await getSetting('storeAddress', '3/12 Phổ Quang, Phường 2, Quận Tân Bình (Khu biệt thự Mekong)'),
        city: await getSetting('storeCity', 'Ho Chi Minh'),
        country: await getSetting('storeCountry', 'VN'),
        full_name: await getSetting('storeName', 'SIM & eSIM Quốc Tế Gohub'),
        postcode: await getSetting('storePostalCode', '72108'),
        province: await getSetting('storeProvince', 'VN-SG'),
        telephone: await getSetting('storePhoneNumber', '0866440022')
      };

      const result = await insert('cart_address').given(address).execute(pool);
      await cart.setData('billing_address_id', parseInt(result.insertId, 10));

      // Save payment method
      await cart.setData('payment_method', method_code);

      await saveCart(cart);

      const orderId = await createOrder(cart);

      const customerId = cart.getData('customer_id');

      if (customerId && request.locals.sessionID) {
        // Load the customer from the database
        const customer = await select()
          .from('customer')
          .where('customer_id', '=', customerId)
          .and('status', '=', 1)
          .load(pool);
        // Create a new cart for the customer
        const newCart = await createNewCart(request.locals.sessionID, request.cookies.isoCode || getConfig('shop.currency', 'USD'), customer || {});

        // Add items from the current cart to the new cart with `is_active` set to `false`
        const unPurchasedItems = cart.getUnActiveItems();

        if (unPurchasedItems && unPurchasedItems.length > 0) {
          await Promise.all(unPurchasedItems.map(async (item) => {
            const prod = await item.getProduct();
            const qty = await item.getData('qty');
            const categoryId = await item.getData('category_id');
            const tripStr = await item.getData('trip');

            const newItem = await newCart.addItem(prod.product_id, qty);
            await newItem.updateCategoryId(parseInt(categoryId, 10));
            await newItem.cloneTripDateStr(tripStr);
          }));
          await saveCart(newCart);

          setContextValue(request, 'cartId', cart.getData('uuid'));
        }
      }

      // Load created order
      order = await select()
        .from('order')
        .where('uuid', '=', orderId)
        .load(pool);

      order.items = await select()
        .from('order_item')
        .where('order_item_order_id', '=', order.order_id)
        .execute(pool);

      order.shipping_address = await select()
        .from('order_address')
        .where('order_address_id', '=', order.shipping_address_id)
        .load(pool);

      order.billing_address = await select()
        .from('order_address')
        .where('order_address_id', '=', order.billing_address_id)
        .load(pool);
    }

    if (!order) {
      throw new OrderCreationError('Order create failed');
    }

    const isPaymentFailed = order.payment_status === 'failed';

    const paymentIntent = await createPaymentIntent(isPaymentFailed, order, customerCountry, pool);

    response.status(OK);
    response.$body = {
      data: {
        orderData: { ...order },
        tazapayData: paymentIntent
      }
    };
    next();
  } catch (e) {
    if (e instanceof OrderCreationError) {
      error(e.message);
      response.status(INTERNAL_SERVER_ERROR);
      response.json({
        error: {
          message: e.message,
          status: INTERNAL_SERVER_ERROR
        }
      });
    } else if (e instanceof PaymentIntentCreationError) {
      error(e.message);
      response.status(OK);
      response.$body = {
        data: {
          orderData: { ...e.errorExtraParams.order },
          tazapayData: { error: 'Failed to process payment' }
        }
      };
      next();
    } else {
      error(e.message);
      response.status(INTERNAL_SERVER_ERROR);
      response.json({
        error: {
          message: e.message,
          status: INTERNAL_SERVER_ERROR
        }
      });
    }
  }
};

const createPaymentIntent = async (isPaymentFailed, order, customerCountry, pool) => {
    try {
      const foundCurrency = await select()
        .from('currency')
        .where('code', '=', order.currency)
        .load(pool);

      if (!foundCurrency) {
        throw new Error(`Not found currency with code: ${order.currency}`);
      }

      const formatedGrandTotal = convertFromUSD(parseFloat(order.grand_total), foundCurrency.rate, order.currency);

      const items = await select()
        .from('order_item')
        .where('order_item_order_id', '=', order.order_id)
        .execute(pool);
      // Create a PaymentIntent with the order amount and currency
      const successUrl = await getSetting('tazapaySuccessUrl', '');
      const cancelUrl = await getSetting('tazapayCancelUrl', '');

      const body = {
        reference_id: order.uuid,
        success_url: `${successUrl}&uuid=${order.uuid}`,
        cancel_url: `${cancelUrl}&uuid=${order.uuid}`,
        invoice_currency: order.currency,
        amount: smallestUnit.default(formatedGrandTotal, order.currency),
        customer_details: {
          name: order.customer_full_name ?? 'Gohub Bear',
          // todo: use real email of customer
          email: order.customer_email ?? await getSetting('storeEmail', 'booking@gohub.vn'),
          // todo: refactor later, this is just for test
          country: customerCountry ?? 'VN'
        },
        transaction_description: generateTxnDescription(items),
        payment_methods: ['card'],
        expires_at: calculateExpiry(20)
      };
      const idempotencyKey = isPaymentFailed ? null : order.uuid;
      const txn = await makeRequest(idempotencyKey, 'POST', '/v3/checkout', body, 'checkout');

      if (!txn) {
        throw new PaymentIntentCreationError(`Tazapay - Payment transaction create failed`, {
          order
        });
      }

      return txn;

    } catch (e) {
      throw new PaymentIntentCreationError(`Tazapay - Payment transaction create failed: ${e}`, {
        order
      });
    }
  }
;