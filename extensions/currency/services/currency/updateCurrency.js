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
const { getAjv } = require('@evershop/evershop/src/modules/base/services/getAjv');
const currencyDataSchema = require('./currencyDataSchema.json');

function validateCurrencyDataBeforeInsert(data) {
  const ajv = getAjv();
  currencyDataSchema.required = [];
  const jsonSchema = getValueSync(
    'updateCurrencyDataJsonSchema',
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

async function updateCurrencyData(id, data, connection) {
  const currency = await select()
    .from('currency')
    .where('id', '=', id)
    .load(connection);

  if (!currency) {
    throw new Error('Requested currency not found');
  }

  try {
    const newCurrency = await update('currency')
      .given(data)
      .where('id', '=', id)
      .execute(connection);

    return newCurrency;
  } catch (e) {
    if (!e.message.includes('No data was provided')) {
      throw e;
    } else {
      return currency;
    }
  }
}

/**
 * Update currency service. This service will update a currency with all related data
 * @param {String} id
 * @param {Object} data
 * @param {Object} context
 */
async function updateCurrency(id, data, context) {
  const connection = await getConnection();
  await startTransaction(connection);
  const hookContext = {connection, ...context};
  try {
    const currencyData = await getValue('currencyDataBeforeUpdate', data);


    // Validate currency data
    validateCurrencyDataBeforeInsert(currencyData);

    // Insert currency data
    const currency = await hookable(updateCurrencyData, hookContext)(
      id,
      currencyData,
      connection
    );

    console.log("currency update ne: ", currency);

    await commit(connection);
    return currency;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (id, data, context) => {
  // Make sure the context is either not provided or is an object
  if (context && typeof context !== 'object') {
    throw new Error('Context must be an object');
  }
  // Merge hook context with context
  const currency = await hookable(updateCurrency, context)(
    id,
    data,
    context
  );

  console.log("con me no: ", currency)

  return currency;
};
