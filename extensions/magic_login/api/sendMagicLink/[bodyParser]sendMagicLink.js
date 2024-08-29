const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select } = require('@evershop/postgres-query-builder');
const { sendMagicLink } = require('../../services/magicLink/sendMagicLink');
const { info } = require('@evershop/evershop/src/lib/log/logger');

module.exports = async (request, response, delegate, next) => {
  info(`Send Magic Link Controller ${JSON.stringify(request.body)}`);
  const { email } = request.body;

  let customer = await select()
    .from('customer')
    .where('email', '=', email)
    .load(pool);

  if (customer) {
    response.status(400);
    return response.json({
      error: {
        status: 400,
        message: 'This email is already registered'
      }
    });
  }

  const sendMagicLinkResponse = await sendMagicLink(email);
  if (!sendMagicLinkResponse) {
    response.status(400);
    return response.json({
      error: {
        status: 400,
        message: 'Failed to send magic link'
      }
    });
  }

  response.status(OK);
  return response.json({
    message: 'Magic link sent',
    data: null
  });
};
