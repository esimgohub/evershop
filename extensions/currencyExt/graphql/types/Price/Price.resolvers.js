const { error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');

const getIsoCodeFromContext = (context) => {
  return context.cookies?.isoCode || getConfig('shop.currency', 'USD');
};

module.exports = {
  Price: {
    value: (rawPrice, _, context) => {
      const isoCode = getIsoCodeFromContext(context);
      const result = getValue(
        'priceValByExnRatio',
        {
          rawPrice,
          isoCode
        }
      );
      return result
    },
    currency: (_, __, context) => {
      const isoCode = getIsoCodeFromContext(context);
      return isoCode;
    },
    text: (rawPrice, __, context) => {
      const isoCode = getIsoCodeFromContext(context);
      const result = getValue(
        'priceTextByExnRatio',
        {
          rawPrice,
          isoCode
        }
      );
      return result;
    }
  }
};
