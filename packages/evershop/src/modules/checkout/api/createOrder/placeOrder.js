/* eslint-disable camelcase */
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { getCartByUUID } = require('../../services/getCartByUUID');
const { createOrder } = require('../../services/orderCreator');
const { setContextValue } = require('../../../graphql/services/contextHelper');
const { createNewCart } = require('../../services/createNewCart');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {

  try {
    const { cart_id } = request.body;
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


    const orderId = await createOrder(cart);

    // TODO: create new cart with un-purchased items by customerId (in `request.session.customerID`)
    const customerId = cart.getData('customer_id');
    if (customerId && request.locals.sessionID) {
      // Create a new cart for the customer
      const newCart = await createNewCart(request.locals.sessionID, request.cookies.isoCode || getConfig('shop.currency', 'USD'), {
        customerId
      });

      // Add items from the current cart to the new cart with `is_active` set to `false`
      const unPurchasedItems = cart.getUnActiveItems();

      if (unPurchasedItems && unPurchasedItems.length > 0) {
        await Promise.all(unPurchasedItems.map(async (item) => {
          const prod = await item.getProduct();
          const qty = await item.getData('qty');
          await newCart.addItem(prod.product_id, qty);
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

    response.status(OK);
    response.$body = {
      data: {
        ...order,
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
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        message: e.message,
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};
