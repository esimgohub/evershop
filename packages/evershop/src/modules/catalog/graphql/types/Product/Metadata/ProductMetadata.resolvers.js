const { select, selectDistinct } = require('@evershop/postgres-query-builder');
const { DataType } = require('@evershop/evershop/src/modules/catalog/utils/enums/data-type');
const { calculateDataAmountUnit } = require('@evershop/evershop/src/modules/catalog/utils/data-amount');
const { CategoryType } = require('@evershop/evershop/src/modules/catalog/utils/enums/category-type')

module.exports = {
  Product: {
    metadata: async (product, _, { pool, user }) => {
      const parentProductAttributeQuery = select().from('product_attribute_value_index');
      parentProductAttributeQuery
        .leftJoin('attribute')
        .on(
          'attribute.attribute_id',
          '=',
          'product_attribute_value_index.attribute_id'
        );
      parentProductAttributeQuery.where(
        'product_attribute_value_index.product_id',
        '=',
        product.parentProductId
      );
      const parentProductAttributes = await parentProductAttributeQuery.execute(pool);

      // Get metadata from attributes
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
      const productVariantAttributes = await productAttributeQuery.execute(pool);
      
      
      // TODO: I want to extract attribute code name: data-amount and day-amount and multiply it
      const foundDayAmountAttribute = productVariantAttributes.find((a) => a.attribute_code === 'day-amount');
      const dayAmountValue = foundDayAmountAttribute ? parseFloat(foundDayAmountAttribute.option_text) : 1;

      const foundDataTypeAttribute = parentProductAttributes.find((a) => a.attribute_code === 'data-type');

      let dataAmountValue;
      const foundDataAmountAttribute = productVariantAttributes.find((a) => a.attribute_code === 'data-amount');
      if (foundDataAmountAttribute) {
        const isUnlimitedData = foundDataAmountAttribute.option_text.toLowerCase() === 'unlimited';

        dataAmountValue = isUnlimitedData ? -1 : parseInt(foundDataAmountAttribute.option_text);
      }

      // NOTE: The Data Amount Unit must be required always.
      const foundDataAmountUnit = productVariantAttributes.find((a) => a.attribute_code === 'data-amount-unit');

      let totalDataAmount;
      
      const isUnlimitedData = foundDataAmountAttribute.option_text.toLowerCase() === 'unlimited';
      if (isUnlimitedData) {
        totalDataAmount = -1;
      }
      else {
        const isDailyData = foundDataTypeAttribute.option_text === DataType.DailyData;
        if (isDailyData) {
          totalDataAmount = dayAmountValue * dataAmountValue;
        }
        else {
          totalDataAmount = dayAmountValue * dataAmountValue;
          // const isUnlimitedData = foundDataAmountAttribute.option_text.toLowerCase() === 'unlimited';

          // totalDataAmount = isUnlimitedData ? -1 : dayAmountValue * dataAmountValue;
        }
      }
      

      // Get metadata on categories
      const productCategoryQuery = select().from('product_category');

      productCategoryQuery
        .innerJoin('category')
        .on('category.uuid', '=', 'product_category.category_id');

      productAttributeQuery.where('category.category_type', '=', CategoryType.Country)

      productCategoryQuery.where('product_category.product_id', '=', product.uuid);

      const categories = await productCategoryQuery.execute(pool);

      let totalDataAmountText;
      if (isUnlimitedData) {
        totalDataAmountText = "Unlimited";
      }
      else {
        let totalDataAmountValue = totalDataAmount;
        if (totalDataAmount > 1024) {
          totalDataAmountValue = totalDataAmount / 1000;
        }

        totalDataAmountText = `${totalDataAmountValue}${calculateDataAmountUnit(totalDataAmount, foundDataAmountUnit ? foundDataAmountUnit.option_text : 'GB')}`
      }
      

      return {
        totalDataAmount: totalDataAmountText,
        supportedCountries: categories.length !== 0 ? categories.length - 1 : 0,
      };
    }
  }
};
