const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');

module.exports = (request, response, delegate, next) => {
  if (!request.isCustomerLoggedIn()) {
    response.redirect(buildUrl('login'));
  } else {
    response.redirect(buildUrl('account'));
  }
};
