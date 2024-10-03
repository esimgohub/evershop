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

  const { first_name, last_name, email, language_code, currency_code } =
    request.body;

  try {
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

    const result = await updateCustomer(
      {
        uuid: currentCustomer.uuid,
        first_name,
        last_name,
        email,
        language_code,
        currency_code,
        referral_code: coupon.coupon,
        referred_code
      },
      {
        routeId: request.currentRoute.id
      }
    );
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
