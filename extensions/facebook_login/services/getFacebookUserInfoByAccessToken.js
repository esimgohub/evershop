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

    const { data } = response;

    info(`Facebook user info response ${JSON.stringify(data)}`);

    if (!data?.id) {
      info(`Failed to get facebook user info ${JSON.stringify(data)}`);
      return null;
    }

    const { id, name, email, picture } = data;

    const lastName = name?.split(' ')[1];
    const firstName = name?.split(' ')[0];

    return {
      id,
      email,
      given_name: firstName,
      family_name: lastName,
      picture
    };
  } catch (err) {
    error(`Failed to get facebook user info ${err.message}`);
    return null;
  }
};
