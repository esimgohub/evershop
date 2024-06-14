const { hookable } = require('@evershop/evershop/src/lib/util/hookable');
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

async function deleteProductData(product, connection) {
  // Delete variant
  const variants = await select()
    .from('product')
    .where('parent_product_uuid', '=', product.uuid)
    .execute(connection);

  for (const variant of variants) {
    await del('product').where('uuid', '=', variant.uuid).execute(connection);
  }

  await del('product_attribute_value_index').where('product_id', '=', product.product_id).execute(connection);
  await del('product_category').where('product_id', '=', product.uuid).execute(connection);
  await del('product_description').where('product_description_product_id', '=', product.product_id).execute(connection);
  await del('product_image').where('product_image_product_id', '=', product.product_id).execute(connection);

  await del('product').where('uuid', '=', product.uuid).execute(connection);
}

/**
 * Delete product service. This service will delete a product with all related data
 * @param {String} uuid
 * @param {Object} context
 */
async function deleteProduct(uuid, context) {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const query = select().from('product');
    query
      .leftJoin('product_description')
      .on(
        'product_description.product_description_product_id',
        '=',
        'product.product_id'
      );

    const product = await query.where('uuid', '=', uuid).load(connection);
    if (!product) {
      throw new Error('Invalid product id');
    }

    await hookable(deleteProductData, { ...context, connection, product })(
      product,
      connection
    );
    
    await commit(connection);
    return product;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
}

module.exports = async (uuid, context) => {
  const connection = await getConnection();
  await startTransaction(connection);
  try {
    const hookContext = {
      connection
    };
    // Make sure the context is either not provided or is an object
    if (context && typeof context !== 'object') {
      throw new Error('Context must be an object');
    }
    // Merge hook context with context
    Object.assign(hookContext, context);
    const product = await hookable(deleteProduct, hookContext)(
      uuid,
      connection
    );
    await commit(connection);
    return product;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
};
