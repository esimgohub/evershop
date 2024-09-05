const { select, insert } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const {
  getCartByUUID
} = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const {
  getOrderByCartUUID,
  getDefaultAddress,
  createCartByUnSelectedItems,
  paymentNative
} = require('../../services/adyen.service');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const {
  saveCart
} = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { createOrder } = require('../../../checkoutApi/services/orderCreator');
const {
  setContextValue
} = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getCountryByIp, parseIp } = require('../../services/utils');

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

module.exports = async (request, response, delegate, next) => {
  try {
    //
    const { cart_id, method_code, ...adyenData } = request.body;

    let order = await getOrderByCartUUID(cart_id, pool);
    const shopperIp = parseIp(request);
    const countryCode = await getCountryByIp(shopperIp);

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

      const address = await getDefaultAddress();
      const result = await insert('cart_address').given(address).execute(pool);
      await cart.setData('billing_address_id', parseInt(result.insertId, 10));

      // Save payment method
      await cart.setData('payment_method', method_code);
      await saveCart(cart);
      const customerId = cart.getData('customer_id');

      const orderId = await createOrder(cart);
      if (customerId && request.locals.sessionID) {
        const unPurchasedItems = cart.getUnActiveItems();
        await createCartByUnSelectedItems(request, unPurchasedItems, customerId, pool);
      }

      // Load created order
      order = await select()
        .from('order')
        .where('uuid', '=', orderId)
        .load(pool);
    }

    if (!order) {
      throw new OrderCreationError('Order create failed');
    }

    const items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', order.order_id)
      .execute(pool);
    const adyenResponse = await paymentNative(
      order,
      items,
      adyenData,
      countryCode,
      shopperIp
    );
    response.status(OK);
    response.$body = {
      data: {
        orderData: { uuid: order.uuid },
        adyenData: adyenResponse
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
          adyenData: { error: 'Failed to process payment' }
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
