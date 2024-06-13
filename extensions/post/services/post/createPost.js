const { getValueSync } = require('@evershop/evershop/src/lib/util/registry');
const {
  startTransaction,
  commit,
  rollback,
  insert
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  getAjv
} = require('@evershop/evershop/src/modules/base/services/getAjv');
const postDataSchema = require('./postDataSchema.json');

function validatePostDataBeforeInsert(data) {
  const ajv = getAjv();
  const jsonSchema = getValueSync('postDataJsonSchema', postDataSchema);
  const validate = ajv.compile(jsonSchema);
  const valid = validate(data);

  if (valid) {
    return {
      thumbnail: data.thumbnail,
      title: data.title,
      description: data.description,
      link: data.link,
      is_visible: data.is_visible
    };
  } else {
    throw new Error(validate.errors[0].message);
  }
}

async function insertPostData(data, connection) {
  const post = await insert('post').given(data).execute(connection);
  return post;
}

async function createPost(data) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const validatedData = validatePostDataBeforeInsert(data);

    const post = await insertPostData(validatedData, connection);
    await commit(connection);

    return post;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (data) => {
  const post = await createPost(data);
  return post;
};
