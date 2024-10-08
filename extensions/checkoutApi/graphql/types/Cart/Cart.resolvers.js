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
        const cartObj = camelCase(cart.exportData());
        return {
          ...cartObj,
          errorCode: CLIENT_CODE.OK
        };
      } catch (error) {
        const regex = /\bcoupon\b/i;
        if (regex.test(error.message)) {
          const cart = await getCartByUUID(cartId);
          const cartObj = camelCase(cart.exportData());
          return {
            ...cartObj,
            errorCode: CLIENT_CODE.COUPON_INVALID
          };
        }
        return null;
      }
    }
  },
  Cart: {
    updateCartItemApi: (cart) =>
      buildUrl('mobileUpdateCartItems', { cart_id: cart.uuid })
  }
};
