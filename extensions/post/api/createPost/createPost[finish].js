const createPost = require('../../services/post/createPost');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate) => {
  const data = request.body;
  const result = await createPost(data);

  return result;
};
