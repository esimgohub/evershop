const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  response.status(OK).json({
    message: "Uploading"
  });


  delegate.bootstrapData;
};
