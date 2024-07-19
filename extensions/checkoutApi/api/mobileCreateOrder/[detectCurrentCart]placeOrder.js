/* eslint-disable camelcase */
const { select, insert } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const { createNewCart } = require('@evershop/evershop/src/modules/checkout/services/createNewCart');
const { setContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { createOrder } = require('../../services/orderCreator');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
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

    // Default address for cart
    const address = {
      address_1: await getSetting('storeAddress', '3/12 Phổ Quang, Phường 2, Quận Tân Bình (Khu biệt thự Mekong)'),
      city: await getSetting('storeCity', 'Ho Chi Minh'),
      country: await getSetting('storeCountry', 'VN'),
      full_name: await getSetting('storeName', 'SIM & eSIM Quốc Tế Gohub'),
      postcode: await getSetting('storePostalCode', '72108'),
      province: await getSetting('storeProvince', 'VN-SG'),
      telephone: await getSetting('storePhoneNumber', '0866440022')
    }

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
