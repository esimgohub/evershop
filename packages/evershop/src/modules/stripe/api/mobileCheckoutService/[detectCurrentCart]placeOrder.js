/* eslint-disable camelcase */
const { select, insert, startTransaction, commit, rollback, update } = require('@evershop/postgres-query-builder');
const { pool, getConnection } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');

const { error } = require('../../../../lib/log/logger');

const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const { createNewCart } = require('@evershop/evershop/src/modules/checkout/services/createNewCart');
const { setContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const stripePayment = require('stripe');
const smallestUnit = require('zero-decimal-currencies');
const { createOrder } = require('../../../../../../../extensions/checkoutApi/services/orderCreator');

const convertFromUSD = (amount, rate, currentIsoCode) => {
  if (currentIsoCode === 'USD') {
    return amount;
  }
  return amount * rate;
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

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  try {
    const { cart_id, payment_method_id } = request.body;
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

          await newCart.addItem(prod.product_id, qty);
          await item.updateCategoryId(parseInt(categoryId, 10));
          await item.cloneTripDateStr(tripStr);
        }));
        await saveCart(newCart);

        setContextValue(request, 'cartId', cart.getData('uuid'));
      }
    }

    // Load created order
    const order = await select()
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

    // todo: order created validation
    if (!order) {
      throw new OrderCreationError('Order create failed');
    }

    // todo: handle payment method

    // todo: create payment intent and confirm intent
    const paymentIntent = await createPaymentIntent(order, payment_method_id, pool);

    // todo: payment intent validation
    if (!paymentIntent) {
      throw new PaymentIntentCreationError('Payment intent create failed', {
        order
      });
    }

    // todo: return orderData + stripeData
    // await commit(pool);

    response.status(OK);
    response.$body = {
      data: {
        orderData: { ...order },
        stripeData: paymentIntent,
        links: [
          {
            rel: 'edit',
            href: buildUrl('orderEdit', { id: order.uuid }),
            action: 'GET',
            types: ['text/xml']
          }
        ]
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
          stripeData: null,
          links: [
            {
              rel: 'edit',
              href: buildUrl('orderEdit', { id: e.errorExtraParams.order.uuid }),
              action: 'GET',
              types: ['text/xml']
            }
          ]
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

const createPaymentIntent = async (order, paymentMethodId, pool) => {
    try {
      const stripeConfig = getConfig('system.stripe', {});
      let stripeSecretKey;
      if (stripeConfig.secretKey) {
        stripeSecretKey = stripeConfig.secretKey;
      } else {
        stripeSecretKey = await getSetting('stripeSecretKey', '');
      }

      const stripe = stripePayment(stripeSecretKey);

      const foundCurrency = await select()
        .from('currency')
        .where('code', '=', order.currency)
        .load(pool);

      if (!foundCurrency) {
        throw new Error(`Not found currency with code: ${order.currency}`);
      }

      const formatedGrandTotal = convertFromUSD(parseFloat(order.grand_total), foundCurrency.rate, order.currency);

      // Create a PaymentIntent with the order amount and currency
      // todo: create payment intent with plain card

      const intent = await stripe.paymentIntents.create({
        amount: smallestUnit.default(formatedGrandTotal, order.currency),
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        currency: order.currency,
        metadata: {
          orderId: order.uuid
        },
        // payment_method: paymentMethodId
        payment_method: paymentMethodId
      });

      const response = await stripe.paymentIntents.confirm(intent.id);
      if (!response) {
        throw new PaymentIntentCreationError(`Payment intent create failed`, {
          order
        });
      }
      await update('order')
        .given({ stripe_client_sec_key: response.client_secret, stripe_payment_method_id: response.payment_method })
        .where('uuid', '=', order.uuid)
        .execute(pool);

      return response;

    } catch (e) {
      throw new PaymentIntentCreationError(`Payment intent create failed: ${e}`, {
        order
      });
    }
  }
;