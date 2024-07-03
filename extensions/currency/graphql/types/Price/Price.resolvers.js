const { error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');

const getIsoCodeFromContext = (context) => {
  // TODO: Set currency in context & get it from header of request, not save in cookie anymore.
  return context.cookies?.isoCode || getConfig('shop.currency', 'USD');
};

module.exports = {
  Price: {
    value: (rawPrice, _, context) => {
      const isoCode = context.currencyCode;
      const result = getValue('priceValByExnRatio', {
        rawPrice,
        isoCode
      });
      return result;
    },
    currency: (_, __, context) => {
      const isoCode = context.currencyCode;
      return isoCode;
    },
    text: (rawPrice, __, context) => {
      const isoCode = context.currencyCode;
      const result = getValue('priceTextByExnRatio', {
        rawPrice,
        isoCode
      });
      return result;
    }
  }
};
