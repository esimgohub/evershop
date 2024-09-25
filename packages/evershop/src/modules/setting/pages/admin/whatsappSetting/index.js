const {
  setContextValue
} = require('../../../../graphql/services/contextHelper');

module.exports = (request) => {
  setContextValue(request, 'pageInfo', {
    title: 'Whatsapp Setting',
    description: 'Whatsapp Setting'
  });
};
