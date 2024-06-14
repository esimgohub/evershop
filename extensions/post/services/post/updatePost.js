const {
  getValueSync,
  getValue
} = require('@evershop/evershop/src/lib/util/registry');
const {
  startTransaction,
  commit,
  rollback,
  update,
  select
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  getAjv
} = require('@evershop/evershop/src/modules/base/services/getAjv');
const postDataSchema = require('./postDataSchema.json');

function validatePostDataBeforeUpdate(data) {
  const ajv = getAjv();
  postDataSchema.required = [];
  const jsonSchema = getValueSync('postDataSchema', postDataSchema);
  const validate = ajv.compile(jsonSchema);
  const isValid = validate(data);

  if (isValid) {
    return data;
  } else {
    throw new Error(validate.errors[0].message);
  }
}

async function updatePostData(id, data, connection) {
  const query = select().from('post');
  const post = await query.where('id', '=', id).load(connection);
  if (!post) {
    throw new Error('Requested post not found');
  }

  try {
    const newPost = await update('post')
      .given(data)
      .where('id', '=', id)
      .execute(connection);
    Object.assign(post, newPost);
  } catch (e) {
    if (!e.message.includes('No data was provided')) {
      throw e;
    }
  }

  return post;
}

async function updatePost(id, data) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const postData = await getValue('postDataBeforeUpdate', data);
    validatePostDataBeforeUpdate(postData);

    const updatedPost = await updatePostData(id, postData, connection);
    await commit(connection);

    return updatedPost;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (id, data) => {
  const post = await updatePost(id, data);
  return post;
};
