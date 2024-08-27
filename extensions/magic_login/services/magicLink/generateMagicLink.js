const { info, error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../token/generateToken');

module.exports.generateMagicLink = async (email) => {
  try {
    const token = await generateToken(email);
    const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');

    console.log("send magic link url: ", homeUrl);

    const magicLink = `${homeUrl}/links/magic-login?token=${token}`;

    return magicLink;
  } catch (err) {
    error(`Failed to get google user info ${err.message}`);
    return null;
  }
};
