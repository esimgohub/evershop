const registerDefaultPostCollectionFilters = require('./services/post/collection/registerDefaultPostCollectionFilters');
const {
  defaultPaginationFilters
} = require('@evershop/evershop/src/lib/util/defaultPaginationFilters');
const { addProcessor } = require('@evershop/evershop/src/lib/util/registry');

module.exports = () => {
  addProcessor(
    'postCollectionFilters',
    registerDefaultPostCollectionFilters,
    1
  );
  addProcessor(
    'postCollectionFilters',
    (filters) => [...filters, ...defaultPaginationFilters],
    2
  );
};
