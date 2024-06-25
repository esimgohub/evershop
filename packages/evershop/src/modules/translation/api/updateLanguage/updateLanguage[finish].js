const updateLanguage = require('../../services/language/updateLanguage');

module.exports = async (request) => {
  const result = await updateLanguage(request.body, {
    routeId: request.currentRoute.id
  });
  return result;
};
