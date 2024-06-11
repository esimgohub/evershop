const { updateCustomer } = require('../../services/customer/updateCustomer');

module.exports = async (request) => {
  const currentCustomer = request.getCurrentCustomer();
  const { fullName, languageCode, currencyCode } = request.body;

  const result = await updateCustomer(
    { id: currentCustomer.uuid, fullName, languageCode, currencyCode },
    {
      routeId: request.currentRoute.id
    }
  );
  return result;
};
