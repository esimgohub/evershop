const updateCurrency = require('../../services/currency/updateCurrency');


module.exports = async (request, response, delegate) => {
  const currency = await updateCurrency(request.params.id, request.body);
  return currency;
};