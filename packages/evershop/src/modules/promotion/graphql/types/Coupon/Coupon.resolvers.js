const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  getCouponsBaseQuery
} = require('../../../services/getCouponsBaseQuery');
const { CouponCollection } = require('../../../services/CouponCollection');

const clientFilterDto = (filter) => {
  if (!filter?.page || !filter.perPage) {
    return [];
  }
  const limitKey = 'limit';
  const pageKey = 'page';

  const operationEnum = 'eq'
  return [
    {
      key: limitKey,
      operation: operationEnum,
      value: filter.perPage
    },
    {
      key: pageKey,
      operation: operationEnum,
      value: filter.page
    }
  ]
}

module.exports = {
  Cart: {
    applyCouponApi: (cart) => buildUrl('couponApply', { cart_id: cart.uuid })
  },
  Query: {
    coupon: async (root, { id }, { pool }) => {
      const query = getCouponsBaseQuery();
      query.where('coupon_id', '=', id);
      const coupon = await query.load(pool);
      return coupon ? camelCase(coupon) : null;
    },
    availableCoupons: async (_, { filters = {} }, { customer }) => {
      if (!customer) {
        return [];
      }

      const query = getCouponsBaseQuery();
      const root = new CouponCollection(query);
      const dto  = clientFilterDto(filters)
      await root.init(dto);
      return root;
    }
  }
};
