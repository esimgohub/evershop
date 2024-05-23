const { hookable } = require('@evershop/evershop/src/lib/util/hookable');
const {
  getValueSync,
  getValue
} = require('@evershop/evershop/src/lib/util/registry');
const {
  startTransaction,
  commit,
  rollback,
  insert
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { getAjv } = require('@evershop/evershop/src/modules/base/services/getAjv');
const currencyDataSchema = require('./currencyDataSchema.json');
const crypto = require('crypto');

function validateCurrencyDataBeforeInsert(data) {
  const ajv = getAjv();
  currencyDataSchema.required = ['code', 'signature', 'rate'];
  const jsonSchema = getValueSync(
    'createCurrencyDataJsonSchema',
    currencyDataSchema
  );
  const validate = ajv.compile(jsonSchema);
  const valid = validate(data);
  if (valid) {
    return data;
  } else {
    throw new Error(validate.errors[0].message);
  }
}

async function insertCurrencyData(data, connection) {
  const { code, signature, rate } = data;

  const insertData = {
    code, signature, rate
  }

  const currency = await insert('currency').given(insertData).execute(connection);
  return currency;
}

/**
 * Create currency service. This service will create a currency with all related data
 * @param {Object} data
 * @param {Object} context
 */
async function createCurrency(data, context) {
  const connection = await getConnection();
  await startTransaction(connection);
  const hookContext = {connection, ...context};
  try {
    const currencyData = await getValue('currencyDataBeforeCreate', data);
    // Validate currency data
    validateCurrencyDataBeforeInsert(currencyData);

    // Insert currency data
    const currency = await hookable(insertCurrencyData, hookContext)(
      currencyData,
      connection
    );

  console.log("created currency: ", currency);


    await commit(connection);
    return currency;
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
  const currency = await hookable(createCurrency)(data, context);
  return currency;
};
