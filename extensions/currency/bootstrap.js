const { request, response } = require('express');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { select } = require('@evershop/postgres-query-builder');

const isoCodeEnums = {
    USD: "USD"
};

const currencyLanguages = {
    "USD": "en-US",
    "EUR": ["de-DE", "en-GB", "es-ES", "fr-FR"],
    "GBP": "en-GB", 
    "JPY": "ja-JP",
    "AUD": "en-AU", 
    "CAD": "en-CA",
    "CHF": ["de-CH", "fr-CH", "it-CH"],
    "CNY": "zh-CN",
    "NZD": "en-NZ",
    "MXN": "es-MX",
    "RUB": "ru-RU",
    "INR": ["hi-IN", "en-IN"],
    "BRL": "pt-BR",
    "KRW": "ko-KR",
    "TRY": "tr-TR",
    "PLN": "pl-PL",
    "ZAR": "en-ZA",
    "NGN": "en-NG",
    "AED": "ar-AE",
    "MYR": "ms-MY",
    "SEK": "sv-SE",  
    "DKK": "da-DK",
    "HKD": ["zh-HK", "en-HK"], 
    "PHP": "tl-PH",
    "IDR": "id-ID",
    "THB": "th-TH",
    "TWD": "zh-TW",
    "NOK": "nb-NO",
    "HUF": "hu-HU",
    "CZK": "cs-CZ",
    "ILS": "he-IL",
    "ARS": "es-AR",
    "CLP": "es-CL",
    "COP": "es-CO",
    "PKR": "ur-PK",
    "KWD": "ar-KW",
    "QAR": "ar-QA"  
};

const currencyDataConfig = {
    USD: {
      code: "USD",
      name: "United States Dollar", 
      symbol: "$",
      decimals: 2,
      subunit: "Cent", 
      languages: ["en-US"]
    },
    VND: {
        code: "VND",
        name: "Vietnamese Dong",
        symbol: "₫",
        decimals: 0,
        subunit: "Hào",
        languages: ["vi-VN"] 
      },
    EUR: {
      code: "EUR",
      name: "Euro",
      symbol: "€",
      decimals: 2, 
      subunit: "Cent",
      languages: ["de-DE", "en-GB","es-ES", "fr-FR"]
    },
  
    GBP: {
      code: "GBP", 
      name: "British Pound",
      symbol: "£",
      decimals: 2,
      subunit: "Penny",
      languages: ["en-GB"]  
    },
  
    JPY: {
      code: "JPY",
      name: "Japanese Yen",  
      symbol: "¥",
      decimals: 0,
      subunit: "Sen",
      languages: ["ja-JP"]
    },
  
    AUD: {
      code: "AUD",
      name: "Australian Dollar",
      symbol: "A$", 
      decimals: 2,
      subunit: "Cent",
      languages: ["en-AU"]
    },
  
    KRW: {
      code: "KRW",
      name: "South Korean Won",
      symbol: "₩",
      decimals: 0,  
      subunit: "Chon",
      languages: ["ko-KR"]
    },
  
    PKR: {
      code: "PKR",
      name: "Pakistani Rupee",
      symbol: "Rs",
      decimals: 2,
      subunit: "Paisa",
      languages: ["ur-PK"]  
    },
  
    // ...
  
    XOF: {
      code: "XOF",  
      name: "West African CFA Franc",
      symbol: "Fr",
      decimals: 0,
      subunit: "Centime",
      languages: ["fr-BJ", "fr-CI"]
    }
  };

function formatCurrency(value, currencyCode, currencyLanguage) {
    // Convert value to smallest currency unit 
    let currencyDataConfig = getCurrencyDataConfig(currencyCode);
    if (!currencyDataConfig) {
        console.log("Currency code not found in currencyDataConfig: ", currencyCode);
        return;
    }

    let decimals = currencyDataConfig.decimals;
    let amount = value * Math.pow(10, decimals);
  
    // Get formatter  
    let formatter = new Intl.NumberFormat(
      currencyLanguage,
      {
        style: 'currency', 
        currency: currencyCode,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }
    );
  
    // Format value
    let output = formatter.format(amount);
  
    // Post-process if needed
    // e.g. remove trailing zeros  
  
    return output;
  
  }
  
  // Helper function
  function getCurrencyDataConfig(code) {
    // Return decimals and other properties  
    return currencyDataConfig[code];
  }

const convertFromUSD = (amount, rate, currentIsoCode) => {
    if (currentIsoCode === isoCodeEnums.USD) {
      return amount;
    }

    return amount * rate;
};

module.exports = () => {
    request.isAdmin = function isAdmin() {
        return !!this.path.startsWith('/admin')
    }
    response.setIsoCodeCookie = function setIsoCodeCookie(isoCode) {
        // TODO: set by conditions
        this.cookie('isoCode', isoCode || getConfig('shop.currency', 'USD'), {});
    }
    addProcessor('priceValByExnRatio', async ({ rawPrice, isoCode }) => {
        const foundCurrency = await select()
        .from('currency')
        .where('code', '=', isoCode)
        .load(pool);

        if (!foundCurrency) {
            // console.log("Not found currency with code: " + code);
            return;
        }

        const priceByRatio = convertFromUSD(parseFloat(rawPrice), foundCurrency.rate, isoCode);

        return priceByRatio;
    });
    addProcessor('priceTextByExnRatio', async ({ rawPrice, isoCode }) => {
        const foundCurrency = await select()
        .from('currency')
        .where('code', '=', isoCode)
        .load(pool);

        if (!foundCurrency) {
            // console.log("Not found currency with code: " + code);
            return;
        }

        const priceByRatio = convertFromUSD(parseFloat(rawPrice), foundCurrency.rate, isoCode);
        
        // return formatCurrency(priceByRatio, isoCode, foundCurrency.language);
        return new Intl.NumberFormat(currencyLanguages[isoCode], {
          style: 'currency',
          currency: isoCode
      }).format(priceByRatio)
    });
};