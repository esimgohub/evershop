const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const { getAppleUserInfo } = require('../../services/getAppleUserInfo');
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
const randomStr = require('@evershop/evershop/src/modules/base/services/randomStr');

module.exports = async (request, response, delegate, next) => {
  const { id_token, first_name, last_name, email } = request.body;

  const appleUserInfo = await getAppleUserInfo(id_token);
  if (!appleUserInfo) {
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
    .select('customer.is_first_login', 'is_first_login')
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

  // The unique identifier for the user in Apple’s system.
  // This value is stable and unique to the user and the app,
  // allowing you to identify the same user across different sessions or devices.
  customerQuery.where('customer.external_id', '=', appleUserInfo.sub);

  let [customer] = await customerQuery.execute(pool);

  if (customer && customer?.status !== AccountStatus.ENABLED) {
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

  if (!customer) {
    const [defaultLanguage, defaultCurrency] = await Promise.all([
      getDefaultLanguage(),
      getDefaultCurrency()
    ]);

    language = defaultLanguage;
    currency = defaultCurrency;

    let emailForSave = null;
    const privateReplyDomain = '@privaterelay.appleid.com';
    if (email && !email.endsWith(privateReplyDomain)) {
      emailForSave = email;
    } else if (
      !appleUserInfo?.email?.endsWith(privateReplyDomain) &&
      appleUserInfo?.email_verified
    ) {
      emailForSave = appleUserInfo.email;
    }

    const fName = typeof first_name === 'string' ? first_name.trim() : 'Bear';
    const lName =
      typeof last_name === 'string' ? last_name.trim() : randomStr();

    customer = await insert('customer')
      .given({
        external_id: appleUserInfo.sub,
        email: emailForSave,
        first_name: fName,
        last_name: lName,
        full_name: `${fName} ${lName}`,
        status: AccountStatus.ENABLED,
        login_source: LoginSource.APPLE,
        language_id: defaultLanguage.id,
        currency_id: defaultCurrency.id,
        is_first_login: true
      })
      .execute(pool);
  }

  const customerResponseData = {
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    avatarUrl: customer.avatar_url,
    isFirstLogin: customer.is_first_login,
    language: createLanguageResponse(language),
    currency: createCurrencyResponse(currency)
  };

  request.locals.customer = customer;
  request.session.customerID = customer.customer_id;
  request.session.loginSource = LoginSource.APPLE;

  delegate.createCustomer = customer;
  response.status(OK);
  response.$body = {
    data: customerResponseData
  };
  next();
};
