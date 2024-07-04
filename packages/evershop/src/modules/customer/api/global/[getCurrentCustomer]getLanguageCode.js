const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { setContextValue } = require('../../../graphql/services/contextHelper');

module.exports = async (request, response, delegate, next) => {
  const currentCustomer = request.getCurrentCustomer();
  let languageCode = currentCustomer?.languageCode || request.cookies.isoCode;

  if (!currentCustomer) {
    const defaultLanguage = await select()
      .from('language')
      .where('is_default', '=', 1)
      .load(pool);

    languageCode = defaultLanguage?.code || getConfig('shop.language', 'en');
  }

  setContextValue(request, 'languageCode', languageCode);
  next();
};
