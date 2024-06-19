const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { google } = require('googleapis');

const getRedirectUrl = () => {
  const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');
  return `${homeUrl}${buildUrl('gcallback')}`;
};

const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

const oauth2Client = new google.auth.OAuth2(
  getConfig('google_login.client_id'),
  getConfig('google_login.client_secret'),
  getRedirectUrl()
);

const googleAuthUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  response_type: 'code',
  prompt: 'consent',
  scope: scopes
});

module.exports = {
  googleAuthUrl,
  oauth2Client
};
