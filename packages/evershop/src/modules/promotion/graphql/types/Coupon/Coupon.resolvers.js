const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  getCouponsBaseQuery
} = require('../../../services/getCouponsBaseQuery');
const { CouponCollection } = require('../../../services/CouponCollection');

const FILTER_MAP = {
  page: 'page',
  perPage: 'limit',
  coupon: 'coupon'
};

const clientFilterDto = (filter) => {
  if (!filter || !Object.keys(filter).length) {
    return [];
  }
  return Object.keys(filter).map((key) => ({
    key: FILTER_MAP[key],
    operation: 'eq',
    value: filter[key]
  }));
};
module.exports = {
  Cart: {
    applyCouponApi: (cart) => buildUrl('couponApply', { cart_id: cart.uuid })
  },
  Coupon: {
    imageUrl: ({ originImage }, _, { homeUrl }) => {
      return `${homeUrl}${originImage}`;
    }
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
      const dto = clientFilterDto(filters);
      await root.init(filters.page, filters.perPage, dto);
      return root;
    }
  }
};
