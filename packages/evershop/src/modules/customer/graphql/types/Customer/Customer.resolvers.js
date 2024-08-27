const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');

module.exports = {
  Query: {
    baseUrl: async (_, {}, { homeUrl }) => homeUrl,
    currentCustomer: async (root, args, { customer }) =>
      customer ? camelCase(customer) : null
  }
};
