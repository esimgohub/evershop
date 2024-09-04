const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { getPaymentList } = require('../../services/adyen.service');
const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, _, next) => {
  try {
    const clientKey = await getSetting('adyenClientKey', null);

    response.status(OK);
    response.$body = {
      data: {
        clientKey
      }
    };
    next()
  } catch (e) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: e.message
      }
    });
  }
};
