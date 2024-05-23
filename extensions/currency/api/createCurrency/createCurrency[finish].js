const createCurrency = require('../../services/currency/createCurrency');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const currency = await createCurrency(request.body, {
    routeId: request.currentRoute.id
  });
  return currency;
};
