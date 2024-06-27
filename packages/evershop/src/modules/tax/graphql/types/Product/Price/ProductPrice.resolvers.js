const {
  getSetting
} = require('@evershop/evershop/src/modules/setting/services/setting');
const {
  toPrice
} = require('@evershop/evershop/src/modules/checkout/services/toPrice');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getTaxRates } = require('../../../../services/getTaxRates');
const { getTaxPercent } = require('../../../../services/getTaxPercent');
const {
  calculateTaxAmount
} = require('../../../../services/calculateTaxAmount');


module.exports = {
  Product: {
    price: async (product, _, { user }) => {
      const taxConfigDisplay = getConfig(
        'pricing.tax.display_catalog_price_including_tax',
        false
      );

      const taxClassId = product.taxClass;
      if (!taxClassId || !taxConfigDisplay || user) {
        return {
          regular: product.price ? parseFloat(product.price) : null,
          oldPrice: product.oldPrice
        };
      } else {
        const taxRates = await getTaxRates(
          taxClassId,
          await getSetting('storeCountry', null),
          await getSetting('storeProvince', null),
          await getSetting('storePostalCode', null)
        );

        // We display the price including tax based on the store address.
        // TODO: This has to be changed to the customer address.
        const percentage = getTaxPercent(taxRates);
        const taxAmount = calculateTaxAmount(percentage, price, 1);
        const includedTaxPrice = toPrice(price + taxAmount);
        return {
          regular: includedTaxPrice,
          oldPrice: includedTaxPrice + 20  // TODO: implement special price
        };
      }
    }
  }
};
