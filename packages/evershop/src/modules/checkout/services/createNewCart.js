const { createNewCart: create } = require('./cart/Cart');

module.exports = exports;

/**
 * This function return a Cart object by the session ID and the customer object
 * Use CartFactory.getCart() instead.
 * @param {string} sid : The session ID
 * @param {string} currency : The currency (ISOCODE)
 * @param {Object} customer : The customer object
 * @param {boolean} is_buy_now : The type of cart
 * @returns {Promise<Cart>}
 */
exports.createNewCart = async (sid, currency, customer = {}, is_buy_now = false) => {
  // Extract the customer info
  // Be carefully with camelCase and snakeCase
  // TODO: refactor in future to ensure always extract right key
  const {
    customer_id,
    email: customer_email,
    group_id: customer_group_id,
    first_name: customer_first_name,
    last_name: customer_last_name
  } = customer;
  const cart = await create({
    sid,
    customer_id,
    customer_email,
    customer_group_id,
    customer_full_name: `${customer_first_name} ${customer_last_name}`,
    currency,
    is_buy_now
  });
  return cart;
};
