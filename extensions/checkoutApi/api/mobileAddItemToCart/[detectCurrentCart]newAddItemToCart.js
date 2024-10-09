const { select } = require('@evershop/postgres-query-builder');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  translate
} = require('@evershop/evershop/src/lib/locale/translate/translate');
const { createNewCart } = require('@evershop/evershop/src/modules/checkout/services/createNewCart');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { getContextValue, setContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');


module.exports = async (request, response, delegate, next) => {
  try {
    let cartId = getContextValue(request, 'cartId');
    let cart;
    if (!cartId) {
      // Create a new cart
      const { sessionID, customer } = request.locals;
      cart = await createNewCart(sessionID, request.cookies.isoCode || getConfig('shop.currency', 'USD'), customer || {});
      cartId = cart.getData('uuid');
    } else {
      cart = await getCartByUUID(cartId); // Cart object
    }

    const { action } = request.query;
    const { sku, qty, categoryId, trip } = request.body;

    if (!categoryId || !trip?.fromDate || !trip?.toDate) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: translate('Missing required param')
        }
      });
      return;
    }

    // Load the product by sku
    const product = await select()
      .from('product')
      .where('sku', '=', sku)
      .and('status', '=', 1)
      .load(pool);

    if (!product) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: translate('Product not found')
        }
      });
      return;
    }

    // If everything is fine, add the product to the cart
    const isBuyNowFlag = action === 'item-buy-now'
    const item = await cart.addItem(product.product_id, parseInt(qty, 10), isBuyNowFlag);
    await item.updateCategoryId(parseInt(categoryId, 10));
    await item.updateTripDate(trip.fromDate.toString(), trip.toDate.toString());

    // Buy now options
    if (action && isBuyNowFlag) {
      await cart.updateDeselectAllItems();
      await cart.updateItemSelection(item.getId(), true);
    }

    await saveCart(cart);
    // Set the new cart id to the context, so next middleware can use it
    setContextValue(request, 'cartId', cart.getData('uuid'));
    response.status(OK);
    response.$body = {
      data: {
        item: item.export(),
        count: cart.getItems().length,
        cartId: cart.getData('uuid')
      }
    };
    next();
  } catch (error) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: error.message
      }
    });
  }
};
