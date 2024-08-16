const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const deleteCustomerAccountById = require('../../services/customer/deleteCustomerAccount');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  try {
    const customer = await deleteCustomerAccountById(request.params.id, {
      routeId: request.currentRoute.id
    });
    response.status(OK);
    response.json({
      data: customer
    });

    console.log("to delete customer account ne");
    await request.deleteCustomerAccount((error) => {
      if (error) {
        response.status(INTERNAL_SERVER_ERROR);
        response.json({
          error: {
            status: INTERNAL_SERVER_ERROR,
            message
          }
        });
      }
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
