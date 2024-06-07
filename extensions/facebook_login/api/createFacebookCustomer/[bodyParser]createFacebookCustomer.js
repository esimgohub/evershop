const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const { getFacebookUserInfo } = require('../../services/getFacebookUserInfo');

module.exports = async (request, response, stack, next) => {
  const { accessToken } = request.body;

  const facebookUserInfo = await getFacebookUserInfo(accessToken);
  if (!facebookUserInfo) {
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
    .where('external_id', '=', facebookUserInfo.id)
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
        external_id: facebookUserInfo.id,
        login_source: 'facebook',
        full_name: facebookUserInfo.name,
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
      name: customer.full_name
    }
  };
  next();
};
