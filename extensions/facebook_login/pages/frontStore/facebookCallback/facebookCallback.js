const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const {
  getFacebookAuthToken
} = require('../../../services/getFacebookAuthToken');
const {
  getFacebookUserInfo
} = require('../../../services/getFacebookUserInfo');
const { select, insert } = require('@evershop/postgres-query-builder');
const { error } = require('@evershop/evershop/src/lib/log/logger');

/* eslint-disable-next-line no-unused-vars */
module.exports = async (request, response, delegate, next) => {
  const { code } = request.query;
  const client_id = getConfig('facebook_login.client_id');
  const app_secret = getConfig('facebook_login.app_secret');

  const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');
  const redirect_uri = `${homeUrl}${buildUrl('facebookCallback')}`;
  const successUrl = getConfig('facebook_login.success_redirect_url', homeUrl);
  const failureUrl = getConfig(
    'facebook_login.failure_redirect_url',
    `${homeUrl}${buildUrl('login')}`
  );

  try {
    const { access_token } = await getFacebookAuthToken(
      code,
      client_id,
      app_secret,
      redirect_uri
    );
    if (!access_token) {
      return response.redirect(failureUrl);
    }

    const userInfo = await getFacebookUserInfo(access_token);
    console.log('userInfo', userInfo);
    // Check if the email exists in the database
    let customer = await select()
      .from('customer')
      .where('external_id', '=', userInfo.id)
      .load(pool);

    if (customer && customer.status !== 1) {
      throw new Error('This account is disabled');
    }

    if (!customer) {
      // If the email does not exist, create a new customer
      customer = await insert('customer')
        .given({
          full_name: userInfo.name,
          external_id: userInfo.id,
          status: 1,
          password: '',
          login_source: 'facebook'
        })
        .execute(pool);
    }
    // Login the customer
    request.session.customerID = customer.customer_id;
    request.session.loginSource = 'facebook';

    // Delete the password field
    delete customer.password;
    // Save the customer in the request
    request.locals.customer = customer;
    request.session.save((e) => {
      if (e) {
        error(e);
        response.redirect(failureUrl);
      } else {
        response.redirect(successUrl);
      }
    });
  } catch (err) {
    error(err.message);
    response.redirect(failureUrl);
  }
};
