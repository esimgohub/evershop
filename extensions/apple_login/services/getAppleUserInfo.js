const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const { error } = require('@evershop/evershop/src/lib/log/logger');

async function getSigningKey(kid) {
  const client = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys'
  });

  const key = await client.getSigningKey(kid);
  const signingKey = key.getPublicKey();
  return signingKey;
}

module.exports.getAppleUserInfo = async (id_token) => {
  try {
    const decoded = jwt.decode(id_token, { complete: true });
    const signingKey = await getSigningKey(decoded.header.kid);
    return jwt.verify(id_token, signingKey, { algorithms: ['RS256'] });
  } catch (e) {
    error(e);
    return null;
  }
};
