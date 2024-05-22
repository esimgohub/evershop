const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');

module.exports = {
  Query: {
    currencies: async (_, { pool }) => {
      const query = select().from('currency');

      return await pool.query(query);
    }
  }
};
