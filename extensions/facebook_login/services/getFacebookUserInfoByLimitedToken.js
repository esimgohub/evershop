const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const getFacebookSigningKey = async (kid) => {
  const jwksUrl = getConfig('facebook_login.facebook_jwks_url');
  const client = jwksClient({
    jwksUri: jwksUrl
  });

  const key = await client.getSigningKey(kid);
  const signingKey = key.getPublicKey();
  return signingKey;
};

const verifyFacebookToken = async (jwtToken, key, alg) => {
  return new Promise((resolve, reject) => {
    jwt.verify(jwtToken, key, { algorithms: [alg] }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports.getFacebookUserInfoByLimitedToken = async (jwtToken) => {
  const decodedToken = jwt.decode(jwtToken, { complete: true });
  if (!decodedToken) {
    throw new Error('Invalid JWT token');
  }
  const header = decodedToken.header;
  const kid = header.kid;
  const alg = header.alg;

  const signingKey = await getFacebookSigningKey(kid);
  const facebookUserInfo = await verifyFacebookToken(jwtToken, signingKey, alg);
  return facebookUserInfo;
};
