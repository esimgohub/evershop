const deletePost = require('../../services/post/deletePost');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const { id } = request.params;
  const result = await deletePost(id);

  return result;
};
