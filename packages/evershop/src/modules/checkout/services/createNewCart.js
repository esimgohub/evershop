const { createNewCart: create } = require('./cart/Cart');

module.exports = exports;

/**
 * This function return a Cart object by the session ID and the customer object
 * Use CartFactory.getCart() instead.
 * @param {string} sid : The session ID
 * @param {string} currency : The currency (ISOCODE)
 * @param {Object} customer : The customer object
 * @returns {Promise<Cart>}
 */
exports.createNewCart = async (sid, currency, customer = {}) => {
  // Extract the customer info
  const {
    customerId: customer_id,
    email: customer_email,
    groupId: customer_group_id,
    firstName: customer_first_name,
    lastName: customer_last_name
  } = customer;
  const cart = await create({
    sid,
    customer_id,
    customer_email,
    customer_group_id,
    customer_full_name: `${customer_first_name} ${customer_last_name}`,
    currency
  });
  return cart;
};
