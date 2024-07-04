const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getCartByUUID
} = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');

module.exports = {
  Query: {
    cartWithOutArg: async (_, __, { cartId }) => {
      console.log('abcd');
      try {
        const cart = await getCartByUUID(cartId);
        return camelCase(cart.exportData());
      } catch (error) {
        return null;
      }
    }
  },
  Cart: {
    updateCartItemApi: (cart) =>
      buildUrl('mobileUpdateCartItems', { cart_id: cart.uuid })
  }
};
