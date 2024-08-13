const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  translate
} = require('@evershop/evershop/src/lib/locale/translate/translate');
const {
  setContextValue
} = require('../../../../graphql/services/contextHelper');

module.exports = (request, response, delegate, next) => {
  console.log("request isCustomerLoggedIn: ", request.isCustomerLoggedIn());

  console.log("account page url: ", buildUrl('account'));

  // Check if the user is logged in
  if (request.isCustomerLoggedIn()) {
    // Redirect to homepage
    response.redirect(buildUrl('account'));
  } else {
    console.log("to set login page");
    setContextValue(request, 'pageInfo', {
      title: translate('Login'),
      description: translate('Login')
    });
    next();
  }
};
