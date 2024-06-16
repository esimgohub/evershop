const { select } = require('@evershop/postgres-query-builder');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getProductsBaseQuery
} = require('../../../services/getProductsBaseQuery');
const { ProductCollection } = require('../../../services/ProductCollection');
const { productDetailDescriptionHtmlTemplate } = require('@evershop/evershop/src/modules/catalog/utils/product-detail');
const { CategoryStatus } = require('../../../utils/enums/category-status');

module.exports = {
  Product: {

    url: async (product, _, { pool }) => {
      // I want to get origin of the url request here

      // Get the url rewrite for this product
      const urlRewrite = await select()
        .from('url_rewrite')
        .where('entity_uuid', '=', product.uuid)
        .and('entity_type', '=', 'product')
        .load(pool);
      if (!urlRewrite) {
        return buildUrl('productView', { uuid: product.uuid });
      } else {
        return urlRewrite.request_path;
      }
    },
    categories: async (product, _, { homeUrl, pool }) => {
      const originCategories = await select().from('category').execute(pool);

      const query = select().from('category');

      query
        .leftJoin('category_description')
        .on(
          'category_description.category_description_category_id',
          '=',
          'category.category_id'
        );
      
      query.innerJoin('product_category')
        .on('product_category.category_id', '=', 'category.uuid');


      query.where('product_category.product_id', '=', product.uuid);
        
      query.andWhere('category.status', '=', CategoryStatus.Enabled);

      const categories = await query.execute(pool);


      const mappedCategories = categories.length > 0 ? categories.map(country => {
        return camelCase({
          ...country,
          category_id: originCategories.find(
            category => category.uuid === country.uuid
          ).category_id
        })
      }) : [];

      console.log("categories: ", categories);


      return mappedCategories;
    },
    formattedHTMLAttribute: async (product, _, { pool, homeUrl }) => {
      // Attributes
      const productAttributeQuery = select().from('product_attribute_value_index');
      productAttributeQuery
        .leftJoin('attribute')
        .on(
          'attribute.attribute_id',
          '=',
          'product_attribute_value_index.attribute_id'
        );
      productAttributeQuery.where(
        'product_attribute_value_index.product_id',
        '=',
        product.productId
      );
      const attributes = await productAttributeQuery.execute(pool);

      // Categories
      const productCategoryQuery = select().from('product_category');
      productCategoryQuery
        .leftJoin('category')
        .on('category.uuid', '=', 'product_category.category_id');

      productCategoryQuery
        .leftJoin('category_description')
        .on(
          'category_description.category_description_category_id',
          '=',
          'category.category_id'
        );
      productCategoryQuery.where('product_category.product_id', '=', product.uuid);

      const categories = await productCategoryQuery.execute(pool);


      const foundPlanType = attributes.find((a) => a.attribute_code === 'plan-type');
      const foundExpiration = attributes.find((a) => a.attribute_code === 'expiration');
      const foundSharing = attributes.find((a) => a.attribute_code === 'sharing');
      const foundNetworkType = attributes.find((a) => a.attribute_code === 'network-type');
      const foundNetworkOperator = attributes.find((a) => a.attribute_code === 'network-operator');
      const foundSpeedThrottle = attributes.find((a) => a.attribute_code === 'speed-throttle');
      const foundDailyResetTime = attributes.find((a) => a.attribute_code === 'daily-reset-time');

      const filledDescription = productDetailDescriptionHtmlTemplate
        .replace('{plan-type}', foundPlanType ? foundPlanType.attribute_name : "Plan Type")
        .replace('{plan-type-value}', foundPlanType ? foundPlanType.option_text : '')
        .replace('{expiration}', foundExpiration ? foundExpiration.attribute_name : "Expiration")
        .replace('{expiration-value}', foundExpiration ? foundExpiration.option_text : '')
        .replace('{sharing}', foundSharing ? foundSharing.attribute_name : "Sharing")
        .replace('{sharing-value}', foundSharing ? foundSharing.option_text : '')
        .replace('{coverage}', "Coverage")
        .replace('{coverage-value}', categories.map(c => `<div style="display: inline-block; margin-right: 8px; line-height: 2"><img width="28" height="20" style="border-radius: 4px; vertical-align: middle" src="${homeUrl}${c.image}" /> <label">${c.name}</label></div>`).join('  '))
        .replace('{network-type}', foundNetworkType ? foundNetworkType.attribute_name : "Network Type")
        .replace('{network-type-value}', foundNetworkType ? foundNetworkType.option_text : '')
        .replace('{network-operator}', foundNetworkOperator ? foundNetworkOperator.attribute_name : "Network Operator")
        .replace('{network-operator-value}', foundNetworkOperator ? foundNetworkOperator.option_text : '')
        .replace('{speed-throttle}', foundSpeedThrottle ? foundSpeedThrottle.attribute_name : "Speed Throttle")
        .replace('{speed-throttle-value}', foundSpeedThrottle ? foundSpeedThrottle.option_text : '')
        .replace('{daily-reset-time}', foundDailyResetTime ? foundDailyResetTime.attribute_name : "Daily Reset Time")
        .replace('{daily-reset-time-value}', foundDailyResetTime ? foundDailyResetTime.option_text : '')

      return filledDescription;
    },
    parentUrlKey: async (product, _, { pool }) => {
      const parentProductQuery = getProductsBaseQuery();
      parentProductQuery.where('uuid', '=', product.parentProductUuid)
      
      const parent = await parentProductQuery.load(pool);

      return parent ? parent.url_key : null;
    },
    promotion: async (product, _, {}) => {
      const { oldPrice } = product;
      const price = parseFloat(product.price);

      const isOldPriceGreaterThanOrEqualCurrentPrice = oldPrice && parseFloat(oldPrice) <= price;

      if (!oldPrice || isOldPriceGreaterThanOrEqualCurrentPrice) {
        return null;
      }

      const promotionValue = (parseFloat(oldPrice) - price) / oldPrice * 100;

      return {
        value: promotionValue.toFixed(0),
        text: `${promotionValue.toFixed(0)}% OFF`
      };
    }
  },
  Query: {
    product: async (_, { id }, { pool }) => {
      const query = getProductsBaseQuery();
      query.where('product.product_id', '=', id);
      const result = await query.load(pool);

      if (!result) {
        return null;
      } else {
        return camelCase(result);
      }
    },
    productByUrlKey: async (_, { urlKey }, { pool }) => {
      const query = getProductsBaseQuery();
      query.where('product_description.url_key', '=', urlKey);
      const result = await query.load(pool);

      if (!result) {
        return null;
      } else {
        return camelCase(result);
      }
    },
    products: async (_, { filters = [], productFilter }, { user }) => {
      const query = getProductsBaseQuery();
      const root = new ProductCollection(query);
      await root.init(filters, productFilter, !!user);
      return root;
    }
  }
};
