const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports.getDefaultLanguage = async () => {
  const defaultLanguage = await select()
    .from('language')
    .where('is_default', '=', 1)
    .load(pool);

  return defaultLanguage;
};
