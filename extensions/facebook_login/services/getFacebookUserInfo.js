const axios = require('axios');
const { error } = require('@evershop/evershop/src/lib/log/logger');
const qs = require('qs');

module.exports.getFacebookUserInfo = async (accessToken) => {
  const facebookUserInfoUrl = 'https://graph.facebook.com/v20.0/me';
  const facebookUserInfoQueryOptions = {
    access_token: encodeURIComponent(accessToken),
    fields: 'id,name,email'
  };

  console.log(
    'facebookUserInfoUrl',
    facebookUserInfoUrl,
    facebookUserInfoQueryOptions
  );

  try {
    const response = await axios.get(facebookUserInfoUrl, {
      params: facebookUserInfoQueryOptions
    });
    console.log('response', response);

    const { data } = response;
    return data;
  } catch (err) {
    error(`Failed to get facebook user info ${err.message}`);
    return null;
  }
};
