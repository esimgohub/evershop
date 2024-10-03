const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  getCouponsBaseQuery
} = require('../../../services/getCouponsBaseQuery');
const { CouponCollection } = require('../../../services/CouponCollection');

const FILTER_MAP = {
  page: 'page',
  perPage: 'limit',
  coupon: 'coupon',
  isPrivate: 'is_private'
};

const clientFilterDto = (filter) => {
  if (!filter || !Object.keys(filter).length) {
    return [];
  }
  return Object.keys(filter)
    .filter((ite) => Boolean(filter[ite]))
    .map((key) => ({
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
    imageUrl: ({ originImage }, _, { homeUrl }) => `${homeUrl}${originImage}`
  },
  Query: {
    coupon: async (root, { id }, { pool }) => {
      const query = getCouponsBaseQuery();
      query.where('coupon_id', '=', id)
      const coupon = await query.load(pool);
      return coupon ? camelCase(coupon) : null;
    },
    availableCoupons: async (_, { filters = {} }, { customer }) => {
      if (!customer) {
        return [];
      }

      const query = getCouponsBaseQuery()
      query.where('status', '=', 1);
      const root = new CouponCollection(query);
      const context = {
        customerId: customer.customer_id,
        page: filters.page,
        perPage: filters.perPage,
        coupon: filters.coupon
      }
      const { coupon, ...rest } = filters;
      const dto = clientFilterDto({ ...rest });

      await root.init(dto, context);
      return root;
    }
  }
};
