const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  setContextValue
} = require('@evershop/evershop/src/modules/graphql/services/contextHelper');

module.exports = async (request, response, delegate, next) => {
  try {
    const query = select();
    query.from('currency');
    query.andWhere('currency.id', '=', request.params.id);
    const currency = await query.load(pool);
    if (currency === null) {
      response.status(404);
      next();
    } else {
      setContextValue(request, 'currencyCode', currency.code);
      setContextValue(request, 'currencyId', currency.id);
      setContextValue(request, 'pageInfo', {
        title: currency.code,
        description: "Currency Edit"
      });
      next();
    }
  } catch (e) {
    next(e);
  }
};
