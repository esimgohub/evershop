const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getGoogleAuthToken } = require('../../../services/getGoogleAuthToken');
const { getGoogleUserInfo } = require('../../../services/getGoogleUserInfo');
const { select, insert } = require('@evershop/postgres-query-builder');
const { error } = require('@evershop/evershop/src/lib/log/logger');
const {
  LoginSource,
  AccountStatus
} = require('@evershop/evershop/src/modules/customer/constant');
const { getDefaultLanguage } = require('../../../services/getDefaultLanguage');
const { getDefaultCurrency } = require('../../../services/getDefaultCurrency');

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
    const { access_token, id_token } = await getGoogleAuthToken(code);
    if (!access_token || !id_token) {
      return response.redirect(failureUrl);
    }

    const userInfo = await getGoogleUserInfo(access_token, id_token);
    if (!userInfo) {
      return response.redirect(failureUrl);
    }

    let customer = await select()
      .from('customer')
      .where('email', '=', userInfo.email)
      .load(pool);

    if (customer && customer.status !== AccountStatus.ENABLED) {
      throw new Error('This account is disabled');
    }

    if (!customer) {
      const [defaultLanguage, defaultCurrency] = await Promise.all([
        getDefaultLanguage(),
        getDefaultCurrency()
      ]);

      customer = await insert('customer')
        .given({
          email: userInfo.email,
          first_name: userInfo.given_name,
          last_name: userInfo.family_name,
          avatar_url: userInfo.picture,
          status: AccountStatus.ENABLED,
          login_source: LoginSource.GOOGLE,
          external_id: userInfo.id,
          language_id: defaultLanguage.id,
          currency_id: defaultCurrency.id
        })
        .execute(pool);
    }

    request.session.customerID = customer.customer_id;
    request.session.loginSource = LoginSource.GOOGLE;
    request.locals.customer = customer;

    // Set cookie for logged customer for web
    await request.loginCustomerViaExternalApp(userInfo.id, (error) => {
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

    request.session.save((e) => {
      if (e) {
        error(e);
        response.redirect(failureUrl);
      }
    });

    response.redirect(success_redirect_url);
  } catch (err) {
    error(err);
    response.redirect(failureUrl);
  }
};
