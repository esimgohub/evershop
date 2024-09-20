const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getCartByUUID
} = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');

module.exports = {
  Query: {
    cartWithOutArg: async (_, { coupon }, { cartId }) => {
      try {
        const cart = await getCartByUUID(cartId);
        if (!!coupon === true) {
          await cart.setData('coupon', coupon);
        }
        return camelCase(cart.exportData());
      } catch (error) {
        const regex = /\bcoupon\b/i;
        if (regex.test(error.message)) {
          const cart = await getCartByUUID(cartId);
          return camelCase(cart.exportData());
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
