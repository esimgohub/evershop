const { error } = require('@evershop/evershop/src/lib/log/logger');
const { pool, getConnection} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  INVALID_PAYLOAD,
  OK,
  INTERNAL_SERVER_ERROR
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { select, insert, startTransaction, commit, rollback } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  const connection = await getConnection();

  const { category_id } = request.params;
  const { product_id } = request.body;

  try {
    await startTransaction(connection);
  
    // Check if the category is exists
    const category = await select()
      .from('category')
      .where('uuid', '=', category_id)
      .load(pool);
    if (!category) {
      response.status(INVALID_PAYLOAD);
      return response.json({
        success: false,
        message: 'Category does not exists'
      });
    }

    // Check if the product is exists
    const product = await select()
      .from('product')
      .where('uuid', '=', product_id)
      .load(pool);
    if (!product) {
      response.status(INVALID_PAYLOAD);
      return response.json({
        success: false,
        message: 'Product does not exists'
      });
    }

    const productCategory = await select()
      .from('product_category')
      .where('category_id', '=', category.uuid)
      .and('product_id', '=', product.uuid)
      .load(pool);
    
    if (productCategory) {
      response.status(OK);

      return response.json({
        success: true,
        message: 'Product is assigned to the category'
      });
    }

    // Add the product_id and category_id to the product_category table
    const result = await insert('product_category')
      .given({
        category_id: category.uuid,
        product_id: product.uuid
      })
      .execute(connection);

    await commit(connection);

    response.status(OK);
    return response.json({
      success: true,
      data: {
        product_id: product.uuid,
        category_id: category.uuid
      }
    });
  } catch (e) {
    await rollback(connection);

    error(e);

    response.status(INTERNAL_SERVER_ERROR);
    return response.json({
      success: false,
      message: e.message
    });
  }
};
