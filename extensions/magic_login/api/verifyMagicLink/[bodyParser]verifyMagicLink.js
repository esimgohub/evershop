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
const {
  getDefaultLanguage
} = require('../../services/language/getDefaultLanguage');
const {
  createLanguageResponse
} = require('../../services/language/createLanguageResponse');
const {
  getDefaultCurrency
} = require('../../services/currency/getDefaultCurrency');
const {
  createCurrencyResponse
} = require('../../services/currency/createCurrencyResponse');

module.exports = async (request, response, delegate, next) => {
  const { token } = request.body;

  try {
    const payload = await verifyToken(token);

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

    customerQuery.where('customer.email', '=', payload.email);

    let customer = await customerQuery.load(pool);

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

    if (!customer) {
      const [defaultLanguage, defaultCurrency] = await Promise.all([
        getDefaultLanguage(),
        getDefaultCurrency()
      ]);

      language = defaultLanguage;
      currency = defaultCurrency;

      customer = await insert('customer')
        .given({
          email: payload.email,
          status: AccountStatus.ENABLED,
          language_id: language.id,
          currency_id: currency.id,
          login_source: LoginSource.MAGIC_LINK,
          is_first_login: true
        })
        .execute(pool);
      delegate.createCustomer = customer;
    }

    request.locals.customer = customer;
    request.session.customerID = customer.customer_id;
    request.session.loginSource = LoginSource.MAGIC_LINK;

    response.status(OK);
    response.$body = {
      data: {
        name: customer.full_name,
        email: customer.email,
        isFirstLogin: customer.is_first_login,
        language: createLanguageResponse(language),
        currency: createCurrencyResponse(currency)
      }
    };
    next();
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      console.error('Token verification failed:', e.message);
      response.status(400);
      response.$body = {
        message: 'Invalid token'
      };
    } else {
      console.error('Unexpected error occurred:', e.message);
      response.status(INTERNAL_SERVER_ERROR);
      response.$body = {
        message: 'Internal server error'
      };
    }
    next();
  }
};
