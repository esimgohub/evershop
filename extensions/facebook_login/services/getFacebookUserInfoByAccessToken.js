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
    const names = data.name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');

    return {
      id: data.id,
      given_name: firstName,
      family_name: lastName,
      picture: data.picture,
      email: data.email
    };
  } catch (err) {
    error(`Failed to get facebook user info ${err.message}`);
    return null;
  }
};
