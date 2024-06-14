const { select } = require('@evershop/postgres-query-builder');

module.exports.getPostBaseQuery = () => {
  const query = select().from('post');
  return query;
};
