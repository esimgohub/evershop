const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { unescape } = require('lodash');

module.exports = {
  Product: {
    description: async (product, _, { pool, user }) => {
      return `<label style="color: #848B91">Note: </label><label style="line-height: 20px">${product.description ? product.description.replace(/<\/?p>/g, "") : "-"}</label>`;
    },
    attribute: async (product, _, { pool, user }) => {
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
      // if (!user) {
      //   query.andWhere('attribute.display_on_frontend', '=', true);
      // }
      const productAttributes = await productAttributeQuery.execute(pool);

      // if product is variant
      const isVariableProduct = product.type === 'variable';
      if (isVariableProduct) {
        return productAttributes.reduce((response, attribute) => {
          if (attribute.attribute_code === 'link') {
            response[attribute.attribute_code] = attribute.option_text.replace("esimgohub.com", "gohub.com");
            return response;
          }

          response[attribute.attribute_code] = attribute.option_text;
          return response;
        }, {});
      }

      const productVariantAttributeQuery = select().from('product_attribute_value_index');
        productVariantAttributeQuery
          .leftJoin('attribute')
          .on(
            'attribute.attribute_id',
            '=',
            'product_attribute_value_index.attribute_id'
          );
        productVariantAttributeQuery.where(
          'product_attribute_value_index.product_id',
          '=',
          product.parentProductId
        );
      const productVariantAttributes = await productVariantAttributeQuery.execute(pool);

      const attributes = [...productAttributes, ...productVariantAttributes];
      
      const responses = attributes.reduce((response, attribute) => {
        response[attribute.attribute_code] = attribute.option_text;
        
        return response;
      }, {});

      const foundDataType = Object.entries(responses).find(([key, value]) => key === 'data-type');
      if (!foundDataType) {
        console.log("Data type not found");
      }

      const foundDayAmount = Object.entries(responses).find(([key, value]) => key === 'day-amount');
      if (!foundDayAmount) {
        console.log("Day amount not found");
      }

      const foundDataAmount = Object.entries(responses).find(([key, value]) => key === 'data-amount');
      if (!foundDataAmount) {
        console.log("Data amount not found");
      }

      responses['data-amount'] = foundDataAmount[1].toLowerCase() === 'unlimited' ? -1 : parseFloat(foundDataAmount[1]);
      responses['day-amount'] = parseFloat(foundDayAmount[1]);
      responses['link'] = responses['link'].replace("esimgohub.com", "gohub.com");
      
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
      const attributes = await query.execute(pool);

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
