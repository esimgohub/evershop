const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { setContextValue } = require('../../../graphql/services/contextHelper');

module.exports = async (request, response, delegate, next) => {
  const currentCustomer = request.getCurrentCustomer();
  let currencyCode = currentCustomer?.currency_code || request.cookies.isoCode;

  if (!currentCustomer) {
    const defaultCurrency = await select()
      .from('currency')
      .where('is_default', '=', 1)
      .load(pool);

    currencyCode = defaultCurrency?.code || getConfig('shop.currency', 'USD');
  }

  setContextValue(request, 'currencyCode', currencyCode);
  next();
};
