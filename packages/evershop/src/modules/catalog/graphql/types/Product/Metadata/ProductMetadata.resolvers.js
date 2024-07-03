const { select, selectDistinct } = require('@evershop/postgres-query-builder');
const { PlanType } = require('@evershop/evershop/src/modules/catalog/utils/enums/plan-type');
const { calculateDataAmountUnit } = require('@evershop/evershop/src/modules/catalog/utils/data-amount');
const { CategoryType } = require('@evershop/evershop/src/modules/catalog/utils/enums/category-type')

module.exports = {
  Product: {
    metadata: async (product, _, { pool, user }) => {
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
      const attributes = await productAttributeQuery.execute(pool);
      
      // TODO: I want to extract attribute code name: data-amount and day-amount and multiply it
      const foundDayAmountAttribute = attributes.find((a) => a.attribute_code === 'day-amount');
      const dayAmountValue = foundDayAmountAttribute ? parseFloat(foundDayAmountAttribute.option_text) : 1;

      const foundPlanTypeAttribute = attributes.find((a) => a.attribute_code === 'plan-type');

      const foundDataAmountAttribute = attributes.find((a) => a.attribute_code === 'data-amount');
      const dataAmountValue = foundDataAmountAttribute ? parseFloat(foundDataAmountAttribute.option_text) : 1;

      // NOTE: The Data Amount Unit must be required always.
      const foundDataAmountUnit = attributes.find((a) => a.attribute_code === 'data-amount-unit');

      const totalDataAmount = foundPlanTypeAttribute.option_text === PlanType.DailyData ?  dayAmountValue * dataAmountValue : dataAmountValue;

      // Get metadata on categories
      const productCategoryQuery = select().from('product_category');

      productCategoryQuery
        .innerJoin('category')
        .on('category.uuid', '=', 'product_category.category_id');

      productAttributeQuery.where('category.category_type', '=', CategoryType.Country)

      productCategoryQuery.where('product_category.product_id', '=', product.uuid);

      const categories = await productCategoryQuery.execute(pool);


      return {
        totalDataAmount: `${totalDataAmount < 10 ? `0${totalDataAmount}` : totalDataAmount} ${calculateDataAmountUnit(totalDataAmount, foundDataAmountUnit ? foundDataAmountUnit.option_text : 'GB')}`,
        supportedCountries: categories.length !== 0 ? categories.length - 1 : 0
      };
    }
  }
};
