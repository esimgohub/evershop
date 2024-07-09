const { info, error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const jwt = require('jsonwebtoken');

module.exports.verifyToken = async (token) => {
  const secretKey = getConfig('magic_login.jwt_secret');

  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        error(`Failed to verify token ${err.message}`);
        reject(err);
      } else {
        info(`Decoded token ${decoded}`);
        resolve(decoded);
      }
    });
  });
};
