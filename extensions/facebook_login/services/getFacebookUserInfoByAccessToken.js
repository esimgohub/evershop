const axios = require('axios');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');

module.exports.getFacebookUserInfoByAccessToken = async (accessToken) => {
  const facebookUserInfoUrl = 'https://graph.facebook.com/v20.0/me';
  const facebookUserInfoQueryOptions = {
    access_token: encodeURIComponent(accessToken),
    fields: 'id,name,email'
  };

  try {
    const response = await axios.get(facebookUserInfoUrl, {
      params: facebookUserInfoQueryOptions
    });
    info('Facebook user info response', response.data);

    const { data } = response;
    return data;
  } catch (err) {
    error(`Failed to get facebook user info ${err.message}`);
    return null;
  }
};
