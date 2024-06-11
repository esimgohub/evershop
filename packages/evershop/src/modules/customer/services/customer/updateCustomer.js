const { hookable } = require('@evershop/evershop/src/lib/util/hookable');
const {
  getValueSync,
  getValue
} = require('@evershop/evershop/src/lib/util/registry');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { snakeCase } = require('@evershop/evershop/src/lib/util/snakeCase');
const {
  startTransaction,
  commit,
  rollback,
  update,
  select
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { getAjv } = require('../../../base/services/getAjv');
const customerDataSchema = require('./customerDataSchema.json');

function validateCustomerDataBeforeInsert(data) {
  const ajv = getAjv();
  customerDataSchema.required = [];

  const jsonSchema = getValueSync('customerDataSchema', customerDataSchema);
  const validate = ajv.compile(jsonSchema);

  const valid = validate(data);
  if (valid) {
    return data;
  } else {
    throw new Error(validate.errors[0].message);
  }
}

async function updateCustomerData(data, connection) {
  const query = select().from('customer');
  const { id, fullName, languageCode, currencyCode } = data;
  const customer = await query.where('uuid', '=', id).load(connection);
  if (!customer) {
    throw new Error('Requested customer not found');
  }

  const camelCasedCustomer = camelCase(customer);
  const updatedCustomer = {
    ...customer,
    languageCode:
      languageCode && languageCode !== camelCasedCustomer.languageCode
        ? languageCode
        : camelCasedCustomer.languageCode,
    currencyCode:
      currencyCode && currencyCode !== camelCasedCustomer.currencyCode
        ? currencyCode
        : camelCasedCustomer.currencyCode,
    fullName:
      fullName && fullName.trim() !== camelCasedCustomer.fullName
        ? fullName
        : camelCasedCustomer.fullName
  };

  try {
    const newCustomer = await update('customer')
      .given(snakeCase(updatedCustomer))
      .where('uuid', '=', id)
      .execute(connection);
    Object.assign(customer, newCustomer);
  } catch (e) {
    if (!e.message.includes('No data was provided')) {
      throw e;
    }
  }
  return customer;
}

/**
 * Update customer service. This service will update a customer with all related data
 * @param {String} uuid
 * @param {Object} data
 * @param {Object} context
 */
async function updateCustomer(data, context) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const customerData = await getValue('customerDataBeforeUpdate', data);
    validateCustomerDataBeforeInsert(customerData);

    const customer = await hookable(updateCustomerData, {
      ...context,
      connection
    })(customerData, connection);

    await commit(connection);
    return customer;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (data, context) => {
  // Make sure the context is either not provided or is an object
  if (context && typeof context !== 'object') {
    throw new Error('Context must be an object');
  }
  const customer = await hookable(updateCustomer, context)(data, context);
  return customer;
};
