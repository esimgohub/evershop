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
  const { uuid, first_name, last_name, email, language_code, currency_code } =
    data;

  const customerQuery = select('customer.customer_id', 'customer_id')
    .select('customer.status', 'status')
    .select('customer.first_name', 'first_name')
    .select('customer.last_name', 'last_name')
    .select('customer.email', 'email')
    .select('customer.avatar_url', 'avatar_url')
    .select('language.id', 'language_id')
    .select('language.code', 'language_code')
    .select('language.name', 'language_name')
    .select('language.icon', 'language_icon')
    .select('currency.code', 'currency_code')
    .select('currency.name', 'currency_name')
    .select('currency.id', 'currency_id')
    .from('customer');

  customerQuery
    .leftJoin('language', 'language')
    .on('customer.language_id', '=', 'language.id');

  customerQuery
    .leftJoin('currency', 'currency')
    .on('customer.currency_id', '=', 'currency.id');

  customerQuery.where('customer.uuid', '=', uuid);

  const customer = await customerQuery.load(connection);
  if (!customer) {
    throw new Error('Requested customer not found');
  }

  let updatedEmail = customer.email;
  let customerLanguage = {
    id: customer.language_id,
    code: customer.language_code,
    name: customer.language_name,
    icon: customer.language_icon
  };

  let customerCurrency = {
    id: customer.currency_id,
    code: customer.currency_code,
    name: customer.currency_name
  };

  if (email?.trim() && email.trim() !== customer.email) {
    const existingCustomerEmail = await query
      .where('email', '=', email)
      .load(connection);
    if (existingCustomerEmail) throw new Error('Email already exists');

    updatedEmail =
      customer.login_source !== LoginSource.MAGIC_LINK
        ? email.trim()
        : customer.email;
  }

  if (language_code && language_code !== customerLanguage.code) {
    const existingLanguage = await select('id', 'code', 'name', 'icon')
      .from('language')
      .where('code', '=', language_code.trim())
      .load(connection);
    customerLanguage = existingLanguage;
  }

  if (currency_code && currency_code !== customerCurrency.code) {
    const existingCurrency = await select('id', 'code', 'name')
      .from('currency')
      .where('code', '=', currency_code.trim())
      .load(connection);
    customerCurrency = existingCurrency;
  }

  const updatedCustomer = {
    ...customer,
    language_id: customerLanguage.id,
    currency_id: customerCurrency.id,
    first_name:
      first_name && first_name.trim() !== customer.first_name
        ? first_name
        : customer.first_name,
    last_name:
      last_name && last_name.trim() !== customer.last_name
        ? last_name
        : customer.last_name,
    email: updatedEmail,
    is_first_login: false
  };

  try {
    const newCustomer = await update('customer')
      .given(updatedCustomer)
      .where('uuid', '=', uuid)
      .execute(connection);

    if (newCustomer.login_source === LoginSource.MAGIC_LINK)
      Object.assign(customer, newCustomer);

    return {
      email: newCustomer.email,
      firstName: newCustomer.first_name,
      lastName: newCustomer.last_name,
      avatarUrl: newCustomer.avatar_url,
      language: {
        code: customerLanguage.code,
        name: customerLanguage.name,
        icon: customerLanguage.icon
      },
      currency: {
        code: customerCurrency.code,
        name: customerCurrency.name
      },
      isFirstLogin: newCustomer.is_first_login
    };
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
