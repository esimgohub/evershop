const {
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { submitPaymentDetails } = require('../../services/adyen.service');

module.exports = async (request, response, _, next) => {
  try {
    const { details } = request.body;
    const adyenResponse = await submitPaymentDetails(details);
    if (!adyenResponse) {
      throw new Error('Failed to handle payment process');
    }
    response.status(OK)
    response.$body = {
      success: true,
      ...adyenResponse
    };
    next()
  } catch (e) {
    response.status(INTERNAL_SERVER_ERROR)
    response.json({
      error: {
        message: e.message,
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};
