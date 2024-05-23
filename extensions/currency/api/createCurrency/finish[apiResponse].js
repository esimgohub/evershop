const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  const currency = await delegate.createCurrency;
  response.status(OK);
  response.json({
    data: {
      ...currency,
      links: [
        {
          rel: 'currencyGrid',
          href: buildUrl('currencyGrid'),
          action: 'GET',
          types: ['text/xml']
        },
        {
          rel: 'edit',
          href: buildUrl('currencyEdit', { id: currency.id }),
          action: 'GET',
          types: ['text/xml']
        }
      ]
    }
  });
};
