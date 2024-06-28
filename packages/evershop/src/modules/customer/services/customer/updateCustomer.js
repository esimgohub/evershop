const { hookable } = require('@evershop/evershop/src/lib/util/hookable');
const {
  getValueSync,
  getValue
} = require('@evershop/evershop/src/lib/util/registry');
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
const { LoginSource } = require('../../constant');

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
  const { id, first_name, last_name, email, language_code, currency_code } =
    data;
  const customer = await query.where('uuid', '=', id).load(connection);
  if (!customer) {
    throw new Error('Requested customer not found');
  }

  let updatedEmail = null;
  if (email) {
    const existingCustomerEmail = await query
      .where('email', '=', email)
      .load(connection);
    if (existingCustomerEmail) throw new Error('Email already exists');

    updatedEmail =
      email.trim() !== customer.email &&
      customer.login_source !== LoginSource.MAGIC_LINK
        ? email.trim()
        : customer.email;
  }

  let languageId = customer.language_id;
  if (language_code) {
    languageId = select('id')
      .from('language')
      .where('code', '=', language_code.trim())
      .load(connection);
  }

  let currencyId = customer.currency_id;
  if (currency_code) {
    currencyId = select('id')
      .from('currency')
      .where('code', '=', currency_code.trim())
      .load(connection);
  }

  const updatedCustomer = {
    ...customer,
    language_id: languageId,
    currency_id: currencyId,
    first_name:
      first_name && first_name.trim() !== customer.first_name
        ? first_name
        : customer.first_name,
    last_name:
      last_name && last_name.trim() !== customer.last_name
        ? last_name
        : customer.last_name,
    email: updatedEmail
  };

  try {
    const newCustomer = await update('customer')
      .given(updatedCustomer)
      .where('uuid', '=', id)
      .execute(connection);

    if (newCustomer.login_source === LoginSource.MAGIC_LINK)
      Object.assign(customer, newCustomer);
    return newCustomer;
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
