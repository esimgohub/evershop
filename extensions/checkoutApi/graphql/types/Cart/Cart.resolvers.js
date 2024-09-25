const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getCartByUUID
} = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const {
  CLIENT_CODE
} = require('@evershop/evershop/src/modules/base/services/errorCode');

module.exports = {
  Query: {
    cartWithOutArg: async (_, { coupon }, { cartId }) => {
      try {
        const cart = await getCartByUUID(cartId);
        if (!!coupon === true) {
          await cart.setData('coupon', coupon);
        }
        return {
          errorCode: CLIENT_CODE.OK,
          cart: camelCase(cart.exportData())
        }
      } catch (error) {
        const regex = /\bcoupon\b/i;
        if (regex.test(error.message)) {
          const cart = await getCartByUUID(cartId);
          return {
            errorCode: CLIENT_CODE.COUPON_INVALID,
            cart: camelCase(cart.exportData())
          }
        }
        return {
          errorCode: CLIENT_CODE.CART_ERROR,
          cart: null
        };
      }
    }
  },
  Cart: {
    updateCartItemApi: (cart) =>
      buildUrl('mobileUpdateCartItems', { cart_id: cart.uuid })
  }
};
