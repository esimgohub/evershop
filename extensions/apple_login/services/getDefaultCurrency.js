const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports.getDefaultCurrency = async () => {
  const defaultCurrency = await select()
    .from('currency')
    .where('is_default', '=', 1)
    .load(pool);

  return defaultCurrency;
};
