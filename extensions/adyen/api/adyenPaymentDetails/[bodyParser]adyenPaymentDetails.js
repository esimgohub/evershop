const {
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { submitPaymentDetails } = require('../../services/adyen.service');

module.exports = async (request, response) => {
  try {
    const { details } = request.body;
    const adyenResponse = await submitPaymentDetails(details);
    if (!adyenResponse) {
      throw new Error('Failed to handle payment process');
    }
    return response.status(OK).json({
      success: true,
      ...adyenResponse
    });
  } catch (e) {
    return response.status(INTERNAL_SERVER_ERROR).json({
      error: {
        message: e.message,
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};
