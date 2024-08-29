const { hookable } = require('@evershop/evershop/src/lib/util/hookable');
const {
  startTransaction,
  commit,
  rollback,
  select,
  update
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { AccountStatus } = require('../../constant');

async function deleteCustomerData(id, connection, customer) {
  await update('customer')
    .given({
      email: `${customer.email}-deleted-${new Date().getTime()}`,
      status: AccountStatus.DISABLED,
      external_id: null
    })
    .where('customer_id', '=', id)
    .execute(connection);
}
/**
 * Delete customer service. This service will delete a customer with all related data
 * @param {String} id
 * @param {Object} context
 */
async function deleteCustomerAccount(id, context) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const query = select().from('customer');
    const customer = await query.where('customer_id', '=', id).load(connection);
    if (!customer) {
      throw new Error('Invalid customer id');
    }
    await hookable(deleteCustomerData, { ...context, connection, customer })(
      id,
      connection,
      customer
    );

    await commit(connection);
    // Delete password from customer object
    delete customer.password;
    return customer;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (id, context) => {
  // Make sure the context is either not provided or is an object
  if (context && typeof context !== 'object') {
    throw new Error('Context must be an object');
  }
  const customer = await hookable(deleteCustomerAccount, context)(id, context);
  return customer;
};
