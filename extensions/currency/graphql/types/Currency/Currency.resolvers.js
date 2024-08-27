/* eslint-disable no-param-reassign */
const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getCurrenciesBaseQuery
} = require('../../../services/getCurrenciesBaseQuery');
const { CurrencyCollection } = require('../../../services/CurrencyCollection');

module.exports = {
  Query: {
    getCurrencies: async (_, { filters = [] }) => {
      const query = getCurrenciesBaseQuery();
      const root = new CurrencyCollection(query);

      await root.init(filters);

      return root;
    },
    getCurrency: async (_, { id }, { pool }) => {
      const query = select().from('currency');

      query.where('id', '=', id);

      const result = await query.load(pool);
      return result ? camelCase(result) : null;
    }
  },
  Customer: {
    currency: async (customer, _, { pool }) => {
      const query = getCurrenciesBaseQuery();
      query.where('currency.code', '=', customer.currencyCode);

      const result = await query.load(pool);
      return camelCase(result);
    }
  }
};
