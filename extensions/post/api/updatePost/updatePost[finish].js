const updatePost = require('../../services/post/updatePost');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const { id } = request.params;
  const data = request.body;

  const result = await updatePost(id, data);
  return result;
};
