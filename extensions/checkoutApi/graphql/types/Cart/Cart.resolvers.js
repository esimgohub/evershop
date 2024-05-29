const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { getCartByUUID } = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getContextValue } = require('@evershop/evershop/src/modules/graphql/services/contextHelper');
const { info } = require('@evershop/evershop/src/lib/log/logger');

module.exports = {
  Query: {
    cartWithOut: async () => {
      try {
        info(`look: ${getContextValue('cartId', null)}`)
        const cartId = getContextValue('cartId', null)
        const cart = await getCartByUUID(cartId);
        return camelCase(cart.exportData());
      } catch (error) {
        return null;
      }
    }
  },
  Cart: {
    updateCartItemApi: (cart) => buildUrl('updateCartItems', { cart_id: cart.uuid })
  }
};