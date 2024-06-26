const { info, error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const jwt = require('jsonwebtoken');

module.exports.generateToken = async (email) => {
  const secretKey = getConfig('magic_login.jwt_secret');
  const expirationTime = getConfig('magic_login.jwt_expiration_time');

  return new Promise((resolve, reject) => {
    jwt.sign(
      { email },
      secretKey,
      {
        expiresIn: expirationTime
      },
      (err, token) => {
        if (err) {
          error(`Failed to generate token ${err.message}`);
          reject(err);
        } else {
          info(`Generated token for email ${email}`);
          resolve(token);
        }
      }
    );
  });
};
