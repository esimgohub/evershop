module.exports.createCurrencyResponse = (currency) => {
  return {
    code: currency.code,
    name: currency.name
  };
};
