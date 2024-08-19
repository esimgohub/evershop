const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  setContextValue
} = require('../../../../graphql/services/contextHelper');
const { getSetting } = require('../../../../setting/services/setting');

module.exports = async (request, response, delegate, next) => {
  if (!request.isCustomerLoggedIn()) {
    response.redirect(buildUrl('login'));
  }
  else {
    response.redirect(buildUrl('account'))
  }
  // setContextValue(request, 'pageInfo', {
  //   title: await getSetting('storeName', 'EverShop'),
  //   description: await getSetting(
  //     'storeDescription',
  //     'An e-commerce platform with Node and Postgres'
  //   ),
  //   url: buildUrl('homepage')
  // });
};
