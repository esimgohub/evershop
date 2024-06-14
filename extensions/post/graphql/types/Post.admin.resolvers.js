const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getPostBaseQuery } = require('../../services/post/getPostBaseQuery');
const {
  PostCollection
} = require('../../services/post/collection/PostCollection');

module.exports = {
  Query: {
    post: async (root, { id }, { pool }) => {
      const query = getPostBaseQuery();
      query.where('id', '=', id);
      const post = await query.load(pool);
      return post ? camelCase(post) : null;
    },
    posts: async (_, { filters = [] }, { user }) => {
      const query = getPostBaseQuery();
      query.orderBy('index', 'ASC');

      const root = new PostCollection(query);
      await root.init(filters, !!user);

      return root;
    }
  }
};
