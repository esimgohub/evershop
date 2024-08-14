const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const deleteCustomerAccount = require('../../services/customer/deleteCustomerAccount');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  try {
    const { customerID } = request.session;
    if (!customerID) {
      throw new Error("User is not logged in or session expired");
    }

    const customer = await deleteCustomerAccount(customerID, {
      routeId: request.currentRoute.id
    });
    response.status(OK);
    response.json({
      data: customer
    });
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
