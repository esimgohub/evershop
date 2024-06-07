const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const axios = require('axios');
const qs = require('qs');

module.exports.getFacebookAuthToken = async (
  code,
  client_id,
  app_secret,
  redirect_uri
) => {
  try {
    const accessTokenUrl =
      'https://graph.facebook.com/v20.0/oauth/access_token';

    const facebookAuthQueryOptions = {
      code,
      client_id,
      client_secret: app_secret,
      redirect_uri
    };
    // Using axios to get the access token
    console.log(
      'dataaaaaaa 1111',
      `${accessTokenUrl}?${qs.stringify(facebookAuthQueryOptions)}`
    );

    const response = await axios.get(accessTokenUrl, {
      params: facebookAuthQueryOptions
    });
    console.log('dataaaaaaa 2222', response);

    const { access_token, token_type, expires_in } = response.data;

    return { access_token };
  } catch (err) {
    console.log('facebook error', err.message);
    if (axios.isAxiosError(err)) {
      error('dataaaaaaa', err.response.data.error.message);
    }
    return { access_token: null };
  }
};
