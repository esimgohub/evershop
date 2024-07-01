const { info, error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const axios = require('axios');
const { generateMagicLink } = require('./generateMagicLink');

module.exports.sendMagicLink = async (email) => {
  try {
    const magicLink = await generateMagicLink(email);
    if (!magicLink) {
      return null;
    }

    const emailServiceUrl = getConfig('magic_login.email_service_url');
    const sendMagicLinkUrl = `${emailServiceUrl}/magic-link`;
    const emailServiceApiKey = getConfig('magic_login.email_service_token');
    const sendMagicLinkResponse = await axios.post(
      sendMagicLinkUrl,
      {
        magicLink,
        toAddresses: email,
        locale: 'en',
        relatedOrderId: 'magic_link'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': emailServiceApiKey
        }
      }
    );

    return sendMagicLinkResponse?.data;
  } catch (err) {
    error(`Failed to send magic link try catch ${JSON.stringify(err)}`);
    if (axios.isAxiosError(err)) {
      error(
        `Failed to send magic link ${JSON.stringify(
          err.response?.data.message
        )}`
      );
      return null;
    }
    return null;
  }
};
