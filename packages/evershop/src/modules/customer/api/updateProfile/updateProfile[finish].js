const { updateCustomer } = require('../../services/customer/updateCustomer');

module.exports = async (request) => {
  const currentCustomer = request.getCurrentCustomer();
  const { first_name, last_name, email, language_code, currency_code } =
    request.body;

  const result = await updateCustomer(
    {
      id: currentCustomer.uuid,
      first_name,
      last_name,
      email,
      language_code,
      currency_code
    },
    {
      routeId: request.currentRoute.id
    }
  );
  return result;
};
