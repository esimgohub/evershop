const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const axios = require('axios');

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

    const response = await axios.get(accessTokenUrl, {
      params: facebookAuthQueryOptions
    });
    info('Facebook access token response', response.data);

    const { access_token, token_type, expires_in } = response.data;

    return { access_token };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      error(err.response.data?.error.message);
    }
    return { access_token: null };
  }
};
