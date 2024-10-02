const { error } = require('@evershop/evershop/src/lib/log/logger');

const {
  OK,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED
} = require('@evershop/evershop/src/lib/util/httpStatus');
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

  const { first_name, last_name, email, language_code, currency_code, referred_code } =
    request.body;

  try {
    const result = await updateCustomer(
      {
        uuid: currentCustomer.uuid,
        first_name,
        last_name,
        email,
        language_code,
        currency_code,
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
