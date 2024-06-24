const {
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../services/token/verifyToken');
const {
  AccountStatus,
  LoginSource
} = require('@evershop/evershop/src/modules/customer/constant');

module.exports = async (request, response, delegate, next) => {
  const { token } = request.body;

  try {
    const payload = await verifyToken(token);

    let customer = await select()
      .from('customer')
      .where('email', '=', payload.email)
      .load(pool);

    if (customer && customer.status !== AccountStatus.ENABLED) {
      response.status(400);
      return response.json({
        error: {
          status: 400,
          message: 'This account is disabled'
        }
      });
    }

    if (!customer) {
      customer = await insert('customer')
        .given({
          email: payload.email,
          status: AccountStatus.ENABLED,
          login_source: LoginSource.GOOGLE
        })
        .execute(pool);
      delegate.createCustomer = customer;
    }

    request.locals.customer = customer;
    response.status(OK);
    response.$body = {
      data: {
        name: customer.full_name,
        email: customer.email
      }
    };
    next();
  } catch (e) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Token verification failed:', error.message);
      response.status(400);
      response.$body = {
        message: 'Invalid token'
      };
    } else {
      console.error('Unexpected error occurred:', error);
      response.status(INTERNAL_SERVER_ERROR);
      response.$body = {
        message: 'Internal server error'
      };
    }
    next();
  }
};
