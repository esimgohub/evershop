const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const {
  CLIENT_CODE
} = require('@evershop/evershop/src/modules/base/services/errorCode');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports = async (request, response) => {
  try {
    if (!request.body.coupon || !/^\S*$/.test(request.body.coupon)) {
      return response.status(INVALID_PAYLOAD).json({
        success: false,
        errorCode: CLIENT_CODE.COUPON_INVALID
      });
    }
    const query = await select()
      .from('coupon', 'c')
      .where('c.coupon', '=', request.body.coupon)
      .andWhere('c.status', '=', 1)
      .andWhere('c.is_referral_code', '=', 1)
    const foundCoupon = await query.load(pool);

    if (!foundCoupon) {
      return response.status(INVALID_PAYLOAD).json({
        success: false,
        errorCode: CLIENT_CODE.COUPON_INVALID
      });
    }

    return response.status(OK).json({
      success: true,
      errorCode: CLIENT_CODE.OK
    });
  } catch (e) {
    return response.status(INTERNAL_SERVER_ERROR).json({
      errorCode: CLIENT_CODE.INTERNAL_ERROR
    });
  }
};
