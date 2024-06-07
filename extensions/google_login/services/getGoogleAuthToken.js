const { error } = require('@evershop/evershop/src/lib/log/logger');
const { oauth2Client } = require('./oauth2');
const axios = require('axios');
const qs = require('qs');

module.exports.getGoogleAuthToken = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens) {
      error(`Failed to get tokens ${tokens}`);
      return null;
    }

    const { access_token, id_token } = tokens;
    return { access_token, id_token };
  } catch (err) {
    error(err);
    return null;
  }
};
