const { bootstrapData } = require('../../services/bootstrapData');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const data = request.body;
  const result = await bootstrapData(data);

  return result;
};
