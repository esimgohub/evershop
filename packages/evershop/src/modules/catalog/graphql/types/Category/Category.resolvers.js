const { select, selectDistinct, execute } = require('@evershop/postgres-query-builder');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { CategoryStatus } = require('@evershop/evershop/src/modules/catalog/utils/enums/category-status')
const {
  getProductsByCategoryBaseQuery
} = require('../../../services/getProductsByCategoryBaseQuery');

const {
  getFilterableAttributes
} = require('../../../services/getFilterableAttributes');
const { ProductCollection } = require('../../../services/ProductCollection');
const {
  getCategoriesBaseQuery
} = require('../../../services/getCategoriesBaseQuery');
const { CategoryCollection } = require('../../../services/CategoryCollection');
const { CategoryType } = require('@evershop/evershop/src/modules/catalog/utils/enums/category-type');


module.exports = {
  Query: {
    category: async (_, { id }, { pool }) => {
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
    categories: async (_, { filters = [] }, { user }) => {
      const query = getCategoriesBaseQuery();
      const root = new CategoryCollection(query);
      await root.init(filters, !!user);
      return root;
    },
    popularCountries: async (_, { filter = {}}, { pool, homeUrl }) => {

      const query = selectDistinct(`category_description.name`, "*").from('category');
      query
        .leftJoin('category_description')
        .on(
          'category_description.category_description_category_id',
          '=',
          'category.category_id'
        );
      query.where("category.category_type", "=", CategoryType.Country);
      query.andWhere("category.status", "=", CategoryStatus.Enabled)
      query.orderByRandomOnFields(['category_description.name', 'category.category_status']);

      if (filter.limit) {
        query.limit(0, filter.limit);
      }

      const popularCountryRecords = await query.execute(pool);

      return popularCountryRecords.length > 0 ? popularCountryRecords.map(country => {
        return camelCase({
          ...country,
          image: `${homeUrl}${country.image}`,
        })
      }) : [];
    },
    supportedCategories: async (_, {}, { pool, homeUrl }) => {
      const categories = await select().from('category').execute(pool);

      const query = selectDistinct(`category_description.name`, "*").from('category');
      query
        .leftJoin('category_description')
        .on(
          'category_description.category_description_category_id',
          '=',
          'category.category_id'
        );

      query.innerJoin("product_category").on(
        'product_category.category_id',
        '=',
        'category.uuid'
      );

      query.where("category.category_type", "=", CategoryType.Country);
      query.andWhere("category.status", "=", CategoryStatus.Enabled);

      const supportedCountryRecords = await query.execute(pool);

      const mappedCategories = supportedCountryRecords.length > 0 ? supportedCountryRecords.map(country => {
        return camelCase({
          ...country,
          category_id: categories.find(
            category => category.uuid === country.uuid
          ).category_id,
          image: `${homeUrl}${country.image}`
        })
      }) : [];

      return mappedCategories;
    }
  },
  Category: {
    products: async (category, { filters = [] }, { user }) => {
      const query = await getProductsByCategoryBaseQuery(
        category.categoryId,
        !user
      );
      const root = new ProductCollection(query);
      await root.init(filters, !!user);
      return root;
    },
    availableAttributes: async (category) => {
      const results = await getFilterableAttributes(category.categoryId);
      return results;
    },
    priceRange: async (category, _, { pool }) => {
      const query = await getProductsByCategoryBaseQuery(
        category.categoryId,
        true
      );
      query
        .select('MIN(product.price)', 'min')
        .select('MAX(product.price)', 'max');
      const result = await query.load(pool);
      return {
        min: result.min || 0,
        max: result.max || 0
      };
    },
    url: async (category, _, { pool }) => {
      // Get the url rewrite for this category
      const urlRewrite = await select()
        .from('url_rewrite')
        .where('entity_uuid', '=', category.uuid)
        .and('entity_type', '=', 'category')
        .load(pool);
      if (!urlRewrite) {
        return buildUrl('categoryView', { uuid: category.uuid });
      } else {
        return urlRewrite.request_path;
      }
    },
    image: (category) => {
      const { image, name } = category;
      if (!image) {
        return null;
      } else {
        return {
          alt: name,
          url: image
        };
      }
    },
    children: async (category, _, { pool }) => {
      const query = select().from('category');
      query
        .leftJoin('category_description', 'des')
        .on(
          'des.category_description_category_id',
          '=',
          'category.category_id'
        );
      query.where('category.parent_id', '=', category.categoryId);
      const results = await query.execute(pool);
      return results.map((row) => camelCase(row));
    },
    path: async (category, _, { pool }) => {
      const query = await execute(
        pool,
        `WITH RECURSIVE category_path AS (
          SELECT category_id, parent_id, 1 AS level
          FROM category
          WHERE category_id = ${category.categoryId}
          UNION ALL
          SELECT c.category_id, c.parent_id, cp.level + 1
          FROM category c
          INNER JOIN category_path cp ON cp.parent_id = c.category_id
        )
        SELECT category_id FROM category_path ORDER BY level DESC`
      );
      const categories = query.rows;
      // Loop the categories and load the category description
      return Promise.all(
        categories.map(async (c) => {
          const query = select().from('category');
          query
            .leftJoin('category_description', 'des')
            .on(
              'des.category_description_category_id',
              '=',
              'category.category_id'
            );
          query.where('category.category_id', '=', c.category_id);
          return camelCase(await query.load(pool));
        })
      );
    },
    parent: async (category, _, { pool }) => {
      if (!category.parentId) {
        return null;
      }
      const query = select().from('category');
      query
        .leftJoin('category_description', 'des')
        .on(
          'des.category_description_category_id',
          '=',
          'category.category_id'
        );
      query.where('category.category_id', '=', category.parentId);
      return camelCase(await query.load(pool));
    }
  },
  Product: {
    categories: async (product, _, { pool }) => {
      const productCategoryQuery = select().from('product_category')
      
      productCategoryQuery.innerJoin("category").on(
        'product_category.category_id',
        '=',
        'category.uuid'
      )
      
      productCategoryQuery.innerJoin("category_description").on(
        'category_description.category_description_category_id',
        '=',
        'category.category_id'
      );
      productCategoryQuery.where('product_id', '=', product.uuid);
      const productCategoryRecords = await productCategoryQuery.execute(pool);

      if (productCategoryRecords.length === 0) {
        return [];
      }

      return productCategoryRecords.map((row) => camelCase(row));
    }
  }
};
