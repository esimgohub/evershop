const { getCartByUUID } = require('../../../../packages/evershop/src/modules/checkout/services/getCartByUUID');
/* eslint-disable camelcase */
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { saveCart } = require('@evershop/evershop/src/modules/checkout/services/saveCart');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { setContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { getAjv } = require('@evershop/evershop/src/modules/base/services/getAjv');
const { getValueSync } = require('@evershop/evershop/src/lib/util/registry');
const jsonSchema = require('./actionDataSchema.json');

const UPDATE_QTY = 'update-quantity';
const UPDATE_SELECTION = 'update-item-selection-for-checkout';
const SELECT_ALL = 'select-all-items-for-checkout';
const DESELECT_ALL = 'deselect-all-items-for-checkout';
const REMOVE_ITEM = 'remove-cart-item';

function validatePayloadForType(data) {
  const ajv = getAjv();
  const validate = ajv.compile(jsonSchema);
  const valid = validate(data);
  if (valid) {
    return data;
  } else {
    throw new Error(validate.errors[0].message);
  }
}

module.exports = async (request, response, delegate, next) => {
  try {
    const cartId = request.params.cart_id;
    const { action } = request.query;
    const { cart_item_uuid, qty, is_active } = request.body;
    const payload = {
      action,
      cart_item_uuid,
      qty,
      is_active
    };
    validatePayloadForType(payload);

    const cart = await getCartByUUID(cartId); // Cart object
    // If the cart is not found, respond with 400
    if (!cart) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Invalid cart id'
        }
      });
      return;
    }

    let responseData = {
      cartId: cartId,
      message: ''
    };

    let filteredItems = [];
    switch (action) {
      case UPDATE_QTY:
        const newQty = parseInt(qty, 10);
        await cart.updateItemQuantity(payload.cart_item_uuid, payload.qty);
        responseData.message = `Item "${payload.cart_item_uuid}": quantity is updated to ${payload.qty}`;
        break;
      case UPDATE_SELECTION:
        await cart.updateItemSelection(payload.cart_item_uuid, payload.is_active);
        responseData.message = `Item "${payload.cart_item_uuid}": \`is_active\` field is updated to ${payload.is_active}`;
        break;
      case SELECT_ALL:
        await cart.updateSelectAllItems();
        responseData.message = `Cart "${payload.cart_item_uuid}": all items are selected`;
        break;
      case DESELECT_ALL:
        await cart.updateDeselectAllItems();
        responseData.message = `Cart "${payload.cart_item_uuid}": all items are de-selected`;
        break;
      case REMOVE_ITEM:
        await cart.removeItem(payload.cart_item_uuid);
        responseData.message = `Item "${payload.cart_item_uuid}": is removed from cart`;
        break;
      default:
        response.status(INVALID_PAYLOAD);
        response.json({
          error: {
            status: INVALID_PAYLOAD,
            message: 'Invalid action type'
          }
        });
        return;
    }
    await saveCart(cart);
    setContextValue(request, 'cartId', cart.getData('uuid'));
    response.status(OK);
    response.$body = {
      data: responseData
    };
    next();
  } catch (error) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        message: error.message,
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};
