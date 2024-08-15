const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');

module.exports = {
  Query: {
    paymentMethods: async () => {
      try {
        const fields = await getValue('paymentMethodList', []);

        return fields;
      } catch (error) {
        return null;
      }
    }
  }
};