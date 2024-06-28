const axios = require('axios');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');

module.exports.getFacebookUserInfoByAccessToken = async (accessToken) => {
  const facebookUserInfoUrl = 'https://graph.facebook.com/v20.0/me';
  const facebookUserInfoQueryOptions = {
    access_token: encodeURIComponent(accessToken),
    fields: 'id,first_name,last_name,email,picture'
  };

  try {
    const response = await axios.get(facebookUserInfoUrl, {
      params: facebookUserInfoQueryOptions
    });
    info('Facebook user info response', response.data);

    const { data } = response;
    return {
      id: data.id,
      given_name: data.first_name,
      family_name: data.last_name,
      email: data.email,
      picture: data.picture.data.url
    };
  } catch (err) {
    error(`Failed to get facebook user info ${err.message}`);
    return null;
  }
};
