const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getCartByUUID
} = require('@evershop/evershop/src/modules/checkout/services/getCartByUUID');

module.exports = {
  Query: {
    cartWithOutArg: async (_, { coupon, isBuyNow }, { cartId }) => {
      try {
        const cart = await getCartByUUID(cartId);
        if (isBuyNow) {
          const items = await cart.getBuyNowItems();
          await cart.setData('items', items, true);
        } else {
          const items = await cart.getBuyNowItems();
          if (items?.length) {
            // remove buy now items
            const items = this.getItems();
            const newItems = items.filter((i) => i.getData('buy_now') !== true);
            await cart.setData('items', newItems, true);
          }
        }
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
