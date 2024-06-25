const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getFacebookAuthUrl } = require('../../../services/getFacebookAuthUrl');

module.exports = (request, response, delegate, next) => {
  // Check if customer is already logged in
  if (request.isCustomerLoggedIn()) {
    response.redirect('/');
    return;
  }
  const client_id = getConfig('facebook_login.client_id');
  const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');
  const redirect_uri = `${homeUrl}${buildUrl('facebookCallback')}`;
  const facebookAuthUrl = getFacebookAuthUrl(client_id, redirect_uri);

  response.redirect(facebookAuthUrl);
};
