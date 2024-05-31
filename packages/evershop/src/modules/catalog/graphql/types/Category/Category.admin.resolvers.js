const { select } = require('@evershop/postgres-query-builder');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');

module.exports = {
  Category: {
    categoryId: (category) => category.categoryId,
    categoryType: (category) => category.categoryType,
    editUrl: (category) => buildUrl('categoryEdit', { id: category.uuid }),
    updateApi: (category) => buildUrl('updateCategory', { id: category.uuid }),
    deleteApi: (category) => buildUrl('deleteCategory', { id: category.uuid }),
    addProductUrl: (category) =>
      buildUrl('addProductToCategory', { category_id: category.uuid }),
    queryProducts: async (category) => {
      const query = select().from("product_category");

      query.where('product_category.category_id', '=', category.uuid)

      query.innerJoin("product").on("product.uuid", "=", "product_category.product_id");

      query
        .leftJoin('product_description')
        .on(
          'product_description.product_description_product_id',
          '=',
          'product.product_id'
        );
      query
        .innerJoin('product_inventory')
        .on(
          'product_inventory.product_inventory_product_id',
          '=',
          'product.product_id'
        );

      query
        .leftJoin('product_image')
        .on('product_image.product_image_product_id', '=', 'product.product_id')
        .and('product_image.is_main', '=', true);

      const foundProducts = await query.execute(pool);

      return foundProducts.length > 0 ? foundProducts.map(product => camelCase(product)) : []
    },
  },

  Query: {
    adminCategoryDetail: async (_, { id }, { pool }) => {
      const query = select().from('category');
      query
        .leftJoin('category_description')
        .on(
          'category_description.category_description_category_id',
          '=',
          'category.category_id'
        );
      query.where('category_id', '=', id);
      const result = await query.load(pool);
      return result ? camelCase(result) : null;
    },
  },
  Product: {
    removeFromCategoryUrl: async (product, { id }, { pool }) => {
      if (!id) {
        return null;
      }

      const category = await select()
        .from('category')
        .where('category_id', '=', id)
        .load(pool);
      
      return buildUrl('removeProductFromCategory', {
        category_id: category.uuid,
        product_id: product.uuid
      });
    }
  }
};
