const { bootstrapData } = require('../../services/bootstrapData');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  try {
    const data = request.body;
    const result = await bootstrapData(data);
    
    return result;
  } catch (error) {
    console.log("Cause when bootstrap data ",error);
  }
};
