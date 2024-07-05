const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const fs = require('fs');

module.exports = async (request, response, delegate, next) => {

  const wellKnownFile = fs.readFileSync()

  response.status(OK).json(wellKnownFile);
  
  next();
};
