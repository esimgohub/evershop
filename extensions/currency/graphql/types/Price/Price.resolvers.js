const { error } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');
const { select } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

const isoCodeEnums = {
  USD: 'USD'
};

const currencyLanguages = {
  'USD': 'en-US',
  'EUR': ['de-DE', 'en-GB', 'es-ES', 'fr-FR'],
  'GBP': 'en-GB',
  'JPY': 'ja-JP',
  'AUD': 'en-AU',
  'CAD': 'en-CA',
  'CHF': ['de-CH', 'fr-CH', 'it-CH'],
  'CNY': 'zh-CN',
  'NZD': 'en-NZ',
  'MXN': 'es-MX',
  'RUB': 'ru-RU',
  'INR': ['hi-IN', 'en-IN'],
  'BRL': 'pt-BR',
  'KRW': 'ko-KR',
  'TRY': 'tr-TR',
  'PLN': 'pl-PL',
  'ZAR': 'en-ZA',
  'NGN': 'en-NG',
  'AED': 'ar-AE',
  'MYR': 'ms-MY',
  'SEK': 'sv-SE',
  'DKK': 'da-DK',
  'HKD': ['zh-HK', 'en-HK'],
  'PHP': 'tl-PH',
  'IDR': 'id-ID',
  'THB': 'th-TH',
  'TWD': 'zh-TW',
  'NOK': 'nb-NO',
  'HUF': 'hu-HU',
  'CZK': 'cs-CZ',
  'ILS': 'he-IL',
  'ARS': 'es-AR',
  'CLP': 'es-CL',
  'COP': 'es-CO',
  'PKR': 'ur-PK',
  'KWD': 'ar-KW',
  'QAR': 'ar-QA'
};


const getIsoCodeFromContext = (context) => {
  // TODO: Set currency in context & get it from header of request, not save in cookie anymore.
  return context.cookies?.isoCode || getConfig('shop.currency', 'USD');
};

const findCurrency = async (isoCode) => {
  return await select()
    .from('currency')
    .where('code', '=', isoCode)
    .load(pool);
};

const convertFromUSD = (amount, rate, currentIsoCode) => {
  if (currentIsoCode === isoCodeEnums.USD) {
    return amount;
  }

  return amount * rate;
};

module.exports = {
  Price: {
    value: async (rawPrice, _, context) => {
      const isoCode = getIsoCodeFromContext(context);
      const foundCurrency = await findCurrency(isoCode);
      if (!foundCurrency) {
        console.error('Not found currency with code: ' + isoCode);
        return;
      }

      return convertFromUSD(parseFloat(rawPrice), foundCurrency.rate, isoCode);
    },
    currency: (_, __, context) => {
      return getIsoCodeFromContext(context);
    },
    text: async (rawPrice, __, context) => {
      const isoCode = getIsoCodeFromContext(context);
      const foundCurrency = await findCurrency(isoCode);
      if (!foundCurrency) {
        console.error('Not found currency with code: ' + isoCode);
        return;
      }

      const priceByRatio = convertFromUSD(parseFloat(rawPrice), foundCurrency.rate, isoCode);

      return new Intl.NumberFormat(currencyLanguages[isoCode], {
        style: 'currency',
        currency: isoCode
      }).format(priceByRatio);
    }
  }
};
