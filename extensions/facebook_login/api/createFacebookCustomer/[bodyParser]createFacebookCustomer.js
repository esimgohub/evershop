const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select, insert } = require('@evershop/postgres-query-builder');
const {
  getFacebookUserInfoByAccessToken
} = require('../../services/getFacebookUserInfoByAccessToken');
const {
  AccountStatus,
  LoginSource
} = require('@evershop/evershop/src/modules/customer/constant');
const {
  getFacebookUserInfoByLimitedToken
} = require('../../services/getFacebookUserInfoByLimitedToken');
const { getDefaultLanguage } = require('../../services/getDefaultLanguage');
const { getDefaultCurrency } = require('../../services/getDefaultCurrency');

const facebookUserExample = {
  iss: 'https://www.facebook.com',
  aud: '837023094911030',
  sub: '7724592770990970',
  iat: 1719376393,
  exp: 1719379993,
  jti: '74HK.3155fc6119fa16be9e05b96a0ed011ee8c8274098da1b43c89391bf9c2a4c072',
  nonce: 'f0a9af78cf93615cd82b63b1413d456e7fc7cf4df20f91c78949e520dbbfe0b4',
  email: 'connhanong_cuoironglenmang_1995@yahoo.com',
  given_name: 'Lê',
  family_name: 'Hiệp',
  name: 'Lê Hiệp',
  picture:
    'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=7724592770990970&height=100&width=100&ext=1721968393&hash=Aba6ZC0BjTmhKlF8aWU6WJei'
};

module.exports = async (request, response, stack, next) => {
  const { accessToken, limitedToken, userId } = request.body;
  if (!accessToken && !limitedToken) {
    response.status(400);
    return response.json({
      error: {
        status: 400,
        message: 'Missing access token'
      }
    });
  }

  let facebookUserInfo = {};

  if (accessToken) {
    facebookUserInfo = await getFacebookUserInfoByAccessToken(accessToken);
  } else if (limitedToken) {
    facebookUserInfo = await getFacebookUserInfoByLimitedToken(limitedToken);
  }

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
        external_id: facebookUserInfo.id,
        login_source: LoginSource.FACEBOOK,
        email: facebookUserInfo.email,
        first_name: facebookUserInfo.given_name,
        last_name: facebookUserInfo.family_name,
        avatar_url: facebookUserInfo.picture,
        status: AccountStatus.ENABLED,
        language_id: defaultLanguage.id,
        currency_id: defaultCurrency.id
      })
      .execute(pool);
  }

  delete customer.password;
  request.locals.customer = customer;
  request.session.customerID = customer.customer_id;
  request.session.loginSource = LoginSource.FACEBOOK;
  delegate.createCustomer = customer;
  response.status(OK);
  response.$body = {
    data: {
      email: customer.email,
      firstName: customer.full_name,
      lastName: customer.last_name,
      avatarUrl: customer.avatar_url
    }
  };
  next();
};
