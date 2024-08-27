const { migrateProductPrice } = require('../../services/migration-data-scripts/migrateProductPrice');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const data = request.body;
  const result = await migrateProductPrice(data);

  return result;
};
