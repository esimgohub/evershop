const { updateProductAttributes } = require('../../services/migration-data-scripts/updateProductAttributes');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const data = request.body;
  const result = await updateProductAttributes(data);

  return result;
};
