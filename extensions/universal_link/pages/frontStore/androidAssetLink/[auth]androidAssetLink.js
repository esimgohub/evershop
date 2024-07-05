const wellKnownJson = require('./.well-known.json');

module.exports = async (request, response, delegate, next) => {
  response.json(wellKnownJson);
};
