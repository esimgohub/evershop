const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const { getGoogleUserInfo } = require('../../services/getGoogleUserInfo');

module.exports = async (request, response, delegate, next) => {
  const { accessToken } = request.body;

  const googleUserInfo = await getGoogleUserInfo(accessToken);
  if (!googleUserInfo) {
    response.status(400);
    return response.json({
      error: {
        status: 400,
        message: 'Invalid access token'
      }
    });
  }

  let customer = await select()
    .from('customer')
    .where('email', '=', googleUserInfo.email)
    .load(pool);

  if (customer && customer.status !== 1) {
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
        external_id: googleUserInfo.id,
        email: googleUserInfo.email,
        full_name: googleUserInfo.name,
        status: 1,
        password: ''
      })
      .execute(pool);
  }

  delete customer.password;
  request.locals.customer = customer;
  delegate.createCustomer = customer;
  response.status(OK);
  response.$body = {
    data: {
      name: customer.full_name,
      email: customer.email
    }
  };
  next();
};
