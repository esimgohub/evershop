const {
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const {
  CLIENT_CODE
} = require('@evershop/evershop/src/modules/base/services/errorCode');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports = async (request, response, _, next) => {
  try {
    if (!request.body.coupon || !/^\S*$/.test(request.body.coupon)) {
      response.status(OK).json({
        success: false,
        errorCode: CLIENT_CODE.COUPON_INVALID
      });
      return;
    }
    const query = select()
      .from('coupon', 'c')
      .where('c.coupon', '=', request.body.coupon);
    query.andWhere('c.status', '=', 1);
    query.andWhere('c.is_referral_code', '=', 1);
    const foundCoupon = await query.load(pool);

    if (!foundCoupon) {
      response.status(OK).json({
        success: false,
        errorCode: CLIENT_CODE.COUPON_INVALID
      });
      return;
    }

    response.status(OK);
    response.$body = {
      success: true,
      errorCode: CLIENT_CODE.OK
    };
    next();
  } catch (e) {
    response.status(INTERNAL_SERVER_ERROR).json({
      errorCode: CLIENT_CODE.INTERNAL_ERROR
    });
  }
};
