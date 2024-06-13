const {
  OPERATION_MAP
} = require('@evershop/evershop/src/lib/util/filterOperationMapp');

module.exports = async function registerDefaultPostCollectionFilters() {
  // List of default supported filters
  const defaultFilters = [
    {
      key: 'title',
      operation: ['like', 'nlike'],
      callback: (query, operation, value, currentFilters) => {
        query.andWhere('post.title', OPERATION_MAP[operation], `%${value}%`);
        currentFilters.push({
          key: 'title',
          operation,
          value
        });
      }
    },
    {
      key: 'description',
      operation: ['like', 'nlike'],
      callback: (query, operation, value, currentFilters) => {
        query.andWhere(
          'post.description',
          OPERATION_MAP[operation],
          `%${value}%`
        );
        currentFilters.push({
          key: 'description',
          operation,
          value
        });
      }
    },
    {
      key: 'is_visible',
      operation: ['eq'],
      callback: (query, operation, value, currentFilters) => {
        query.andWhere('post.is_visible', OPERATION_MAP[operation], value);
        currentFilters.push({
          key: 'is_visible',
          operation,
          value
        });
      }
    }
  ];

  return defaultFilters;
};
