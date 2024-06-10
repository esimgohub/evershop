const createLanguage = require('../../services/language/createLanguage');

module.exports = async (request) => {
  const result = await createLanguage(request.body, {
    routeId: request.currentRoute.id
  });
  return result;
};
