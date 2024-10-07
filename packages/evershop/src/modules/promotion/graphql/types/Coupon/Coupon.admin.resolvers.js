const { GraphQLJSON } = require('graphql-type-json');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { execute } = require('@evershop/postgres-query-builder');
const {
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const _ = require('lodash');
const {
  getCouponsBaseQuery
} = require('../../../services/getCouponsBaseQuery');
const { CouponCollection } = require('../../../services/CouponCollection');

const filtersDto = (filters) => {
  return _.reduce(
    filters,
    (result, filter) => {
      // Create a shallow copy of the result object to avoid mutating the parameter
      const newResult = { ...result };

      // Only include month and year keys in the result
      if (filter.key === 'month' || filter.key === 'year') {
        newResult[filter.key] = parseInt(filter.value, 10); // Convert value to an integer
      }
      return newResult; // Return the new result object
    },
    {}
  );
}

module.exports = {
  JSON: GraphQLJSON,
  Query: {
    coupon: async (root, { id }, { pool }) => {
      const query = getCouponsBaseQuery();
      query.where('coupon_id', '=', id);
      const coupon = await query.load(pool);
      return coupon ? camelCase(coupon) : null;
    },
    coupons: async (_, { filters = [] }, { user }) => {
      // This field is for admin only
      if (!user) {
        return [];
      }
      const query = getCouponsBaseQuery();
      const root = new CouponCollection(query);
      await root.init(filters, {});
      return root;
    },
    referrals: async (_, { filters = [] }, { user }) => {
      try {
        // if (!user) {
        //   return [];
        // }
        const parsedFilter = filtersDto(filters)
        const { month, year } = parsedFilter;

        const rawQuery = `
        with CTE as
        (
          select
          coupon
          from
          coupon c
          where
          c.is_referral_code = true
        )

        select
            COUNT(*),
            SUM(o.discount_amount)
        from
            "order" o
        where
        o.coupon in (
            select coupon from CTE
        )
        and
            extract(month from o.created_at) = '${month}'
        and 
            extract(year from o.created_at) = '${year}';
        `;

        const rawCustomerQuery = `
        select
          COUNT(*)
        from
          customer c
        where
          coalesce(c.referred_code, '') != ''
        and
          extract(month from c.created_at) = '${month}'
        and 
          extract(year from c.created_at) = '${year}'
        `;

        const { rows: orderRows } = await execute(pool, rawQuery);
        const { rows: customerRows } = await execute(pool, rawCustomerQuery);

        const { count: qtyByMonth, sum: discountAmountByMonth } = orderRows[0];
        const { count: totalNewRegistry } = customerRows[0];

        return {
          qtyByMonth: qtyByMonth ?? 0,
          discountAmountByMonth: discountAmountByMonth ?? 0,
          newRegisterByMonth: totalNewRegistry ?? 0
        };
      } catch (e) {
        return {
          error: {
            message: e.message,
            status: INTERNAL_SERVER_ERROR
          }
        };
      }
    }
  },
  referralTracking: {
    // Total no. of referrals code usage count per month:
    qtyByMonth: ({ qtyByMonth }) => qtyByMonth,
    // Amount of total discount per month through referral
    discountAmountByMonth: async ({ discountAmountByMonth }) =>
      discountAmountByMonth,
    // Total no. of new users joined applied the referral code
    newRegisterByMonth: async ({ newRegisterByMonth }) => newRegisterByMonth
  },
  Coupon: {
    targetProducts: ({ targetProducts }) => {
      if (!targetProducts) {
        return null;
      } else {
        return camelCase(targetProducts);
      }
    },
    condition: ({ condition }) => {
      if (!condition) {
        return null;
      } else {
        return camelCase(condition);
      }
    },
    userCondition: ({ userCondition }) => {
      if (!userCondition) {
        return null;
      } else {
        return camelCase(userCondition);
      }
    },
    buyxGety: ({ buyxGety }) => {
      if (!buyxGety) {
        return [];
      } else {
        return buyxGety.map((item) => camelCase(item));
      }
    },
    editUrl: ({ uuid }) => buildUrl('couponEdit', { id: uuid }),
    updateApi: (coupon) => buildUrl('updateCoupon', { id: coupon.uuid }),
    deleteApi: (coupon) => buildUrl('deleteCoupon', { id: coupon.uuid })
  }
};
