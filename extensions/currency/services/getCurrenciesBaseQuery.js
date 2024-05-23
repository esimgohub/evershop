const { select } = require('@evershop/postgres-query-builder');

module.exports.getCurrenciesBaseQuery = () => select().from('currency');
