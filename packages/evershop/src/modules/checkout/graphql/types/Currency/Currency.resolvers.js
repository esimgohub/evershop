/* eslint-disable no-param-reassign */
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  getCurrenciesBaseQuery
} = require('../../../services/getCurrenciesBaseQuery');

module.exports = {
  Query: {
    getSummaryCurrencies: async () => {
      const currencies = await getCurrenciesBaseQuery().execute(pool);

      return currencies.map((row) => camelCase(row));
    }
  }
};
