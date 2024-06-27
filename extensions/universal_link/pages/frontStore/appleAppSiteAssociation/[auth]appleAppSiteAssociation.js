const { googleAuthUrl } = require('../../../services/oauth2');

module.exports = (request, response, delegate, next) => {
  if (request.isCustomerLoggedIn()) {
    response.json({
      apple_app_site_association: '1',
    });
    return;
  }
};
