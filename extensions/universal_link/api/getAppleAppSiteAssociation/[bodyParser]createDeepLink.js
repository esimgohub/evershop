const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const wellKnownFile = require('./.well-known.json');

module.exports = async (request, response, delegate, next) => {
  response.status(OK).json(wellKnownFile);
  
  next();
};
