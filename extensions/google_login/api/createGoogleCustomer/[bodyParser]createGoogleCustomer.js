const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const { getGoogleUserInfo } = require('../../services/getGoogleUserInfo');
const {
  AccountStatus,
  LoginSource
} = require('@evershop/evershop/src/modules/customer/constant');
const { getDefaultLanguage } = require('../../services/getDefaultLanguage');
const { getDefaultCurrency } = require('../../services/getDefaultCurrency');
const {
  createLanguageResponse
} = require('../../services/mapper/createLanguageResponse');
const {
  createCurrencyResponse
} = require('../../services/mapper/createCurrencyResponse');

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

  let customerQuery = select('customer.customer_id', 'customer_id')
    .select('customer.status', 'status')
    .select('customer.first_name', 'first_name')
    .select('customer.last_name', 'last_name')
    .select('customer.email', 'email')
    .select('customer.avatar_url', 'avatar_url')
    .select('language.code', 'language_code')
    .select('language.name', 'language_name')
    .select('language.icon', 'language_icon')
    .select('currency.code', 'currency_code')
    .select('currency.name', 'currency_name')
    .from('customer');

  customerQuery
    .leftJoin('language', 'language')
    .on('customer.language_id', '=', 'language.id');

  customerQuery
    .leftJoin('currency', 'currency')
    .on('customer.currency_id', '=', 'currency.id');

  customerQuery.where('customer.external_id', '=', googleUserInfo.id);

  let [customer] = await customerQuery.execute(pool);

  if (customer && customer.status !== AccountStatus.ENABLED) {
    response.status(400);
    return response.json({
      error: {
        status: 400,
        message: 'This account is disabled'
      }
    });
  }

  let language = customer && {
    code: customer.language_code,
    name: customer.language_name,
    icon: customer.language_icon
  };
  let currency = customer && {
    code: customer.currency_code,
    name: customer.currency_name
  };

  let isFirstLogin = false;

  if (!customer) {
    isFirstLogin = true;
    const [defaultLanguage, defaultCurrency] = await Promise.all([
      getDefaultLanguage(),
      getDefaultCurrency()
    ]);

    language = defaultLanguage;
    currency = defaultCurrency;

    customer = await insert('customer')
      .given({
        external_id: googleUserInfo.id,
        email: googleUserInfo.email,
        first_name: googleUserInfo.given_name,
        last_name: googleUserInfo.family_name,
        avatar_url: googleUserInfo.picture,
        status: AccountStatus.ENABLED,
        login_source: LoginSource.GOOGLE,
        language_id: defaultLanguage.id,
        currency_id: defaultCurrency.id
      })
      .execute(pool);
  }

  const customerResponseData = {
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    avatarUrl: customer.avatar_url,
    isFirstLogin,
    language: createLanguageResponse(language),
    currency: createCurrencyResponse(currency)
  };

  request.locals.customer = customer;
  request.session.customerID = customer.customer_id;
  request.session.loginSource = LoginSource.GOOGLE;

  delegate.createCustomer = customer;
  response.status(OK);
  response.$body = {
    data: customerResponseData
  };
  next();
};
