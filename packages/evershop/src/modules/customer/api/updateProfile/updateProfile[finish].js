const { updateCustomer } = require('../../services/customer/updateCustomer');

module.exports = async (request) => {
  const currentCustomer = request.getCurrentCustomer();
  const { full_name, language_code, currency_code } = request.body;

  const result = await updateCustomer(
    {
      id: currentCustomer.uuid,
      full_name,
      language_code,
      currency_code
    },
    {
      routeId: request.currentRoute.id
    }
  );
  return result;
};
