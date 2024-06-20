/* eslint-disable no-param-reassign */
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');

module.exports = {
  Currency: {
    editUrl: (currency) => {
      return buildUrl('currencyEdit', { id: currency.id });
    },
    updateApi: (currency) =>
      buildUrl('updateCurrency', { id: currency.id }),
    deleteApi: (currency) =>
      buildUrl('deleteCurrency', { id: currency.id })
  },
};
