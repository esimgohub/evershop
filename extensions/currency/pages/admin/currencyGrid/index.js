const {
  buildFilterFromUrl
} = require('@evershop/evershop/src/lib/util/buildFilterFromUrl');
const {
  setContextValue
} = require('@evershop/evershop/src/modules/graphql/services/contextHelper');

// eslint-disable-next-line no-unused-vars
module.exports = (request, response) => {
  setContextValue(request, 'pageInfo', {
    title: 'Currencies title',
    description: 'Currencies Description'
  });
  setContextValue(request, 'filtersFromUrl', buildFilterFromUrl(request));
};
