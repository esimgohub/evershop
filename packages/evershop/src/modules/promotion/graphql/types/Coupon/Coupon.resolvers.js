const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  getCouponsBaseQuery
} = require('../../../services/getCouponsBaseQuery');
const { CouponCollection } = require('../../../services/CouponCollection');

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
    availableCoupons: async () => {
      // TODO: get promo code by conditions
      // START COMMENT
      // Get the user's customer group and email
      // let customerGroup = '';
      // let customerEmail = '';
      // if (user) {
      //   const customerQuery = select('customer_group.customer_group_id')
      //     .select('customer.email')
      //     .from('customer');
      //   customerQuery
      //     .leftJoin('customer_group')
      //     .on('customer.group_id', '=', 'customer_group.customer_group_id');
      //   customerQuery
      //     .where('customer_id', '=', user.customer_id);
      //
      //   const customerResult = await customerQuery.load(pool);
      //   if (!customerResult) {
      //     throw new Error('Customer not found');
      //   }
      //   customerGroup = customerResult.customer_group_id;
      //   customerEmail = customerResult.email;
      // }
      // subQuery.addRaw(
      //   'AND',
      //   `(("user_condition"::jsonb ->> 'emails' = '' OR "user_condition"::jsonb ->> 'emails' ILIKE :email)
      //     AND
      //    ("user_condition"::jsonb ->> 'groups' = '' OR "user_condition"::jsonb ->> 'groups' ILIKE :group))
      //   `,
      //   { email: `%${customerEmail}%`, group: `%${customerGroup}%` }
      // );
      // END COMMENT

      // Get active coupons within the validity period and matching the user conditions
      const query = getCouponsBaseQuery();
      query.where('status', '=', true)
        .addRaw('AND', 'start_date <= NOW()')
        .addRaw('AND', 'end_date >= NOW()');
      const root = new CouponCollection(query);
      await root.init([]);
      return root;
    }
  }
};
