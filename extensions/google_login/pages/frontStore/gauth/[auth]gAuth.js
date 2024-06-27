const { googleAuthUrl } = require('../../../services/oauth2');

module.exports = (request, response, delegate, next) => {
  if (request.isCustomerLoggedIn()) {
    response.redirect('/');
    return;
  }
  response.redirect(googleAuthUrl);
};
