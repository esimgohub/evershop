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
const { info } = require('@evershop/evershop/src/lib/log/logger');
const createCoupon = require('@evershop/evershop/src/modules/promotion/services/coupon/createCoupon');
const generateReferralCode = require('@evershop/evershop/src/modules/customer/services/customer.service');

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

  customerQuery
    .where('customer.external_id', '=', googleUserInfo.id)
    .andWhere('customer.login_source', '=', LoginSource.GOOGLE);

  let [customer] = await customerQuery.execute(pool);

  info(`createGoogleCustomer.executeQuery: ${JSON.stringify(customer)}`);

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

    let nextReferralCode = null;
    let flag = false;
    do {
      const temp = generateReferralCode(googleUserInfo.given_name ?? 'Bear')
      const foundCoupon = await select()
        .from('coupon', 'c')
        .where('c.coupon', '=', temp)
        .load(pool);
      if (!foundCoupon) {
        nextReferralCode = temp;
        flag = true;
      }
    } while (!flag)

    // todo: generate coupon
    const couponRequest = {
      coupon: nextReferralCode,
      status: 1,
      discount_amount: 30,
      discount_type: 'percentage_discount_to_entire_order',
      // 0 || null means dont validate
      max_uses_time_per_coupon: 0,
      max_uses_time_per_customer: 1,
      is_private: 1,
      user_condition: { emails: '', groups: [''], purchased: '' },
      condition: { order_qty: '', order_total: '', first_purchase: true },
      description: `Referral code of ${googleUserInfo.given_name + googleUserInfo.family_name}`
    };
    const coupon = await createCoupon(couponRequest, {});
    customer = await insert('customer')
      .given({
        external_id: googleUserInfo.id,
        email: googleUserInfo.email,
        first_name: googleUserInfo.given_name,
        last_name: googleUserInfo.family_name,
        full_name: googleUserInfo.given_name + googleUserInfo.family_name,
        avatar_url: googleUserInfo.picture,
        status: AccountStatus.ENABLED,
        login_source: LoginSource.GOOGLE,
        language_id: defaultLanguage.id,
        currency_id: defaultCurrency.id,
        is_first_login: true,
        referral_code: coupon?.coupon ?? null
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
    currency: createCurrencyResponse(currency),
    referral_code: customer.referral_code
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
