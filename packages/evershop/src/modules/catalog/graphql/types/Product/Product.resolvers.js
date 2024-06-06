const { select } = require('@evershop/postgres-query-builder');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const {
  getProductsBaseQuery
} = require('../../../services/getProductsBaseQuery');
const { ProductCollection } = require('../../../services/ProductCollection');
const { productDetailDescriptionHtmlTemplate } = require('@evershop/evershop/src/modules/catalog/utils/product-detail');

module.exports = {
  Product: {

    url: async (product, _, { pool }) => {
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
    formattedHTMLAttribute: async (product, _, { pool }) => {
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
      const foundNetworkOperatorLogo = attributes.find((a) => a.attribute_code === 'network-operator-logo');
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
        .replace('{coverage-value}', categories.map(c => `<img width="24" height="24" src="${c.image}" /> ${c.name}`).join(' '))
        .replace('{network-type}', foundNetworkType ? foundNetworkType.attribute_name : "Network Type")
        .replace('{network-type-value}', foundNetworkType ? foundNetworkType.option_text : '')
        .replace('{network-operator}', foundNetworkOperator ? foundNetworkOperator.attribute_name : "Network Operator")
        .replace('{network-operator-value}', foundNetworkOperatorLogo ? `<img src="${foundNetworkOperatorLogo.option_text}" />` : '')
        .replace('{speed-throttle}', foundSpeedThrottle ? foundSpeedThrottle.attribute_name : "Speed Throttle")
        .replace('{speed-throttle-value}', foundSpeedThrottle ? foundSpeedThrottle.option_text : '')
        .replace('{daily-reset-time}', foundDailyResetTime ? foundDailyResetTime.attribute_name : "Daily Reset Time")
        .replace('{daily-reset-time-value}', foundDailyResetTime ? foundDailyResetTime.option_text : '')

      return filledDescription;
    },
    promotion: async (product, _, { pool }) => {
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
    products: async (_, { filters = [] }, { user }) => {
      const query = getProductsBaseQuery();
      const root = new ProductCollection(query);
      await root.init(filters, !!user);
      return root;
    }
  }
};
