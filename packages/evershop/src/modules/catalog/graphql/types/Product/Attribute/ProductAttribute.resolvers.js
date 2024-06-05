const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { PlanType } = require('../../../../utils/enums/plan-type');

module.exports = {
  Product: {
    attribute: async (product, _, { pool, user }) => {
      const query = select().from('product_attribute_value_index');
      query
        .leftJoin('attribute')
        .on(
          'attribute.attribute_id',
          '=',
          'product_attribute_value_index.attribute_id'
        );
      query.where(
        'product_attribute_value_index.product_id',
        '=',
        product.productId
      );
      if (!user) {
        query.andWhere('attribute.display_on_frontend', '=', true);
      }
      const attributes = await query.execute(pool);

    
      const responses = attributes.reduce((response, attribute) => {
        response[attribute.attribute_code] = attribute.option_text;
        
        return response;
      }, {});


      const foundPlanType = Object.entries(responses).find(([key, value]) => key === 'plan-type');
      if (!foundPlanType) {
        console.log("Plan type not found");
      }

      const foundDayAmount = Object.entries(responses).find(([key, value]) => key === 'day-amount');
      if (!foundDayAmount) {
        console.log("Day amount not found");
      }

      const foundDataAmount = Object.entries(responses).find(([key, value]) => key === 'data-amount');
      if (!foundDataAmount) {
        console.log("Data amount not found");
      }

      const foundDataAmountUnit = Object.entries(responses).find(([key, value]) => key === 'data-amount-unit');
      if (!foundDataAmountUnit) {
        console.log("Data amount unit not found");
      }

      // Combine data amount and data amount unit
      switch(foundPlanType[1]) {
        case PlanType.DailyData:
          responses['data-amount'] = `${foundDataAmount[1]} ${foundDataAmountUnit ? foundDataAmountUnit[1] : 'GB'}/days`;
          break;
        case PlanType.FixedData:
          responses['data-amount'] = `${foundDataAmount[1]} ${foundDataAmountUnit ? foundDataAmountUnit[1] : 'GB'} / ${foundDayAmount[1]} ${parseInt(foundDayAmount[1]) === 1 ? 'day' : 'days'}`;
          break;
        default:
          break;
      }

      responses['day-amount'] = `${foundDayAmount[1]} ${parseInt(foundDayAmount[1]) === 1 ? 'day' : 'days'}`;
      
      return responses;
    },
    attributeIndex: async (product, _, { pool, user }) => {
      const query = select().from('product_attribute_value_index');
      query
        .leftJoin('attribute')
        .on(
          'attribute.attribute_id',
          '=',
          'product_attribute_value_index.attribute_id'
        );
      query.where(
        'product_attribute_value_index.product_id',
        '=',
        product.productId
      );
      if (!user) {
        query.andWhere('attribute.display_on_frontend', '=', true);
      }
      let attributes = await query.execute(pool);

      const foundDataAmount = attributes.find(
        (a) => a.attribute_code === 'data-amount'
      );
      const foundDataAmountUnit = attributes.find(
        (a) => a.attribute_code === 'data-amount-unit'
      );

      // Combine data amount and data amount unit

      if (foundDataAmount && foundDataAmountUnit) {
        foundDataAmount.option_text = `${parseInt(foundDataAmount.option_text) < 10 ? `0${foundDataAmount.option_text}` : foundDataAmount.option_text} ${foundDataAmountUnit.option_text}`;
      }

      return attributes.map((a) => camelCase(a));
    },
    attributes: async (product, _, { pool, user }) => {
      const valueIndex = (
        await select()
          .from('product_attribute_value_index')
          .where('product_id', '=', product.productId)
          .execute(pool)
      ).map((row) => row.attribute_id);
      const attributes = await select()
        .from('attribute')
        .where('attribute_id', 'IN', valueIndex)
        .and('display_on_frontend', 'IN', user ? [true] : [false, true])
        .execute(pool);
      return attributes.map((a) => camelCase(a));
    }
  }
};
