const { select } = require('@evershop/postgres-query-builder');
const { error } = require('@evershop/evershop/src/lib/log/logger');
const {
  OK,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED
} = require('@evershop/evershop/src/lib/util/httpStatus');
const createCoupon = require('@evershop/evershop/src/modules/promotion/services/coupon/createCoupon');
const {
  CouponBuilder,
  generateReferralCode
} = require('@evershop/evershop/src/modules/promotion/services/coupon/coupon.service');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const updateCustomer = require('../../services/customer/updateCustomer');

module.exports = async (request, response, delegate, next) => {
  const currentCustomer = request.getCurrentCustomer();

  if (!currentCustomer) {
    response.status(UNAUTHORIZED);
    response.json({
      error: {
        status: UNAUTHORIZED,
        message: 'Unauthorized'
      }
    });
    return;
  }

  const query = select();
  query
    .from('customer')
    .select('customer.is_first_login')
    .where('customer_id', '=', currentCustomer.customer_id)
  const foundCustomer = await query.load(pool);

  const {
    first_name,
    last_name,
    email,
    language_code,
    currency_code,
    referred_code
  } = request.body;

  try {
    const updateCustomerRequest = {
      uuid: currentCustomer.uuid,
      first_name,
      last_name,
      email,
      language_code,
      currency_code
    };

    if (foundCustomer.is_first_login) {
      const referralCode = await generateReferralCode(
        currentCustomer.first_name,
        pool
      );

      const couponBuilder = new CouponBuilder();
      const couponRequest = couponBuilder
        .setCoupon(referralCode)
        .setIsReferralCode(1)
        .setDiscount(30, 'percentage')
        .setMaxUsesPerCoupon(0)
        .setMaxUsesPerCustomer(1)
        .setCondition('', '', true)
        .setDescription(`Referral code of ${currentCustomer.first_name}`)
        .build();

      const coupon = await createCoupon(couponRequest, {});
      updateCustomerRequest.referral_code = coupon.coupon
      updateCustomerRequest.referred_code = referred_code
    }

    const result = await updateCustomer(updateCustomerRequest, {
      routeId: request.currentRoute.id
    });
    response.status(OK);
    response.$body = {
      status: OK,
      message: 'Update profile successfully',
      data: { ...result }
    };
    next();
  } catch (e) {
    error(e);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: e.message
      }
    });
  }
};
