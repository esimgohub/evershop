const {
  startTransaction,
  commit,
  rollback,
  select,
  del
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');

async function deletePostData(id, connection) {
  await del('post').where('id', '=', id).execute(connection);
}

async function deletePost(id) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const query = select().from('post');
    const post = await query.where('id', '=', id).load(connection);

    if (!post) {
      throw new Error('Invalid post id');
    }

    await deletePostData(id, connection);
    await commit(connection);

    return post;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (id) => {
  const post = await deletePost(id);
  return post;
};
