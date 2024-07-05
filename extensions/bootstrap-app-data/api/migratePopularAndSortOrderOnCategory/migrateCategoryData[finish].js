const { migratePopularAndSortOrder } = require('../../services/migration-data-scripts/migratePopularAndSortOrderOnCategory');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const data = request.body;
  const result = await migratePopularAndSortOrder(data);

  return result;
};
