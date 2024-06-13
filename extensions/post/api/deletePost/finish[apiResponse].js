const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  const page = await delegate.createPost;
  response.status(OK);
  response.json({
    data: {
      ...page
    }
  });
};
