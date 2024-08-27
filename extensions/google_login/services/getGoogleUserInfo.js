const { info, error } = require('@evershop/evershop/src/lib/log/logger');
const axios = require('axios');

module.exports.getGoogleUserInfo = async (accessToken, idToken) => {
  const url = `https://www.googleapis.com/oauth2/v1/userinfo`;

  try {
    const response = await axios.get(url, {
      params: {
        access_token: accessToken
      },
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    const { data } = response;
    info(`Google user info ${JSON.stringify(data)}`);
    return data;
  } catch (err) {
    error(`Failed to get google user info ${err.message}`);
    return null;
  }
};
