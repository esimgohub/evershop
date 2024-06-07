const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const {
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { getGoogleAuthToken } = require('../../../services/getGoogleAuthToken');
const { getGoogleUserInfo } = require('../../../services/getGoogleUserInfo');
const { select, insert } = require('@evershop/postgres-query-builder');
const { error } = require('@evershop/evershop/src/lib/log/logger');

/* eslint-disable-next-line no-unused-vars */
module.exports = async (request, response, delegate, next) => {
  const { code } = request.query;
  const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');
  const success_redirect_url = getConfig(
    'google_login.success_redirect_url',
    homeUrl
  );
  const failureUrl = getConfig(
    'google_login.failure_redirect_url',
    `${homeUrl}${buildUrl('login')}`
  );

  try {
    // Get the access token from google using the code
    const { access_token, id_token } = await getGoogleAuthToken(code);
    if (!access_token || !id_token) {
      return response.redirect(failureUrl);
    }

    // Get the user info from google using the access token
    const userInfo = await getGoogleUserInfo(access_token, id_token);
    if (!userInfo) {
      return response.redirect(failureUrl);
    }

    // Check if the email exists in the database
    let customer = await select()
      .from('customer')
      .where('email', '=', userInfo.email)
      .load(pool);

    if (customer && customer.is_google_login === false) {
      throw new Error('This email is already registered');
    }
    if (customer && customer.status !== 1) {
      throw new Error('This account is disabled');
    }

    if (!customer) {
      // If the email does not exist, create a new customer
      customer = await insert('customer')
        .given({
          email: userInfo.email,
          full_name: userInfo.name,
          status: 1,
          password: '',
          login_source: 'google'
        })
        .execute(pool);
    }
    // Login the customer
    request.session.customerID = customer.customer_id;
    request.session.loginSource = 'google';
    // Delete the password field
    delete customer.password;
    // Save the customer in the request
    request.locals.customer = customer;

    response.redirect(success_redirect_url);
  } catch (err) {
    error(err);
    response.redirect(failureUrl);
  }
};
