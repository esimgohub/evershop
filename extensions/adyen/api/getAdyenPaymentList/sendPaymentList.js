const { getPaymentList } = require('../../services/adyen.service');
const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, _, next) => {
  try {
    let data = [];
    const list = await getPaymentList();
    if (list.length > 0) {
      data = [...list]
    }

    response.status(OK);
    response.json({
      data
    });
    next();
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
