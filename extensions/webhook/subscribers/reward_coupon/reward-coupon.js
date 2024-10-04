const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const createCoupon = require('@evershop/evershop/src/modules/promotion/services/coupon/createCoupon');
const {
  CouponBuilder,
  generateReferralCode
} = require('@evershop/evershop/src/modules/promotion/services/coupon/coupon.service');

module.exports = async function (data) {
  try {
    const { coupon } = data;
    if (coupon) {
      const query = await select()
        .from('coupon', 'c')
        .where('c.coupon', '=', coupon)
        .andWhere('c.is_referral_code', '=', 1);
      const foundCoupon = await query.load(pool);

      if (foundCoupon) {
        // check the referral of current coupon
        const queryCustomer = await select()
          .from('customer')
          .where('status', '=', 1)
          .andWhere('referral_code', '=', coupon);
        const foundCustomer = await queryCustomer.load(pool);

        if (foundCustomer) {
          const referralCode = await generateReferralCode(
            foundCustomer?.email?.split('@')[0]?.slice(0, 5),
            pool
          );

          const couponBuilder = new CouponBuilder();
          const couponRequest = couponBuilder
            .setCoupon(referralCode)
            .setDiscount(30, 'percentage')
            .setMaxUsesPerCoupon(1)
            .setMaxUsesPerCustomer(1)
            .setDescription(`Reward coupon code for ${foundCustomer.first_name}`)
            .build();

          const coupon = await createCoupon(couponRequest, {});

          if (coupon.coupon) {
            await insert('customer_coupon_use')
              .given({
                customer_id: foundCustomer.customer_id,
                coupon: coupon.coupon,
                used_time: 0
              })
              .execute(pool);
          }
        }
      }
    }
  } catch (e) {
    error(`Failed to reward coupon: ${e.message}`);
  }
};
