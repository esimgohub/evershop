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

const facebookUserInfoExample = {
  id: '115665475172743656167',
  email: 'nguyenonkhoi123@gmail.com',
  verified_email: true,
  name: 'Khoi Nguyen',
  given_name: 'Khoi',
  family_name: 'Nguyen',
  picture:
    'https://lh3.googleusercontent.com/a/ACg8ocKKkh5veW62XS5BhnieEauRyIlPlS6N2jw6jjpDSL48e4F-KA=s96-c'
};

module.exports = async (request, response, delegate, next) => {
  const { accessToken } = request.body;

  const googleUserInfo = await getGoogleUserInfo(accessToken);
  console.log('googleUserInfo', googleUserInfo);
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

  if (customer && customer.status !== AccountStatus.ENABLED) {
    response.status(400);
    return response.json({
      error: {
        status: 400,
        message: 'This account is disabled'
      }
    });
  }

  if (!customer) {
    const [defaultLanguage, defaultCurrency] = await Promise.all([
      getDefaultLanguage,
      getDefaultCurrency
    ]);

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
  request.locals.customer = customer;
  request.session.customerID = customer.customer_id;
  request.session.loginSource = LoginSource.GOOGLE;
  delegate.createCustomer = customer;
  response.status(OK);
  response.$body = {
    data: {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      avatarUrl: customer.avatar_url
    }
  };
  next();
};
