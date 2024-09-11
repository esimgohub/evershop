const {
  getOrderByUUID,
  getOrderItemByID
} = require('../../../services/esim.service');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getValue } = require('@evershop/evershop/src/lib/util/registry');
const { select } = require('@evershop/postgres-query-builder');
const _ = require('lodash');
const {
  productDetailDescriptionHtmlTemplate
} = require('@evershop/evershop/src/modules/catalog/utils/product-detail');
const {
  getProductsBaseQuery
} = require('@evershop/evershop/src/modules/catalog/services/getProductsBaseQuery');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const variantsOptions = [
  {
    attribute_code: 'data-amount-unit',
    attribute_name: 'Data Amount Unit',
    attribute_id: 14,
    option_id: 73,
    option_text: 'GB'
  },
  {
    attribute_code: 'day-amount',
    attribute_name: 'Day Amount',
    attribute_id: 5,
    option_id: 57,
    option_text: '20'
  },
  {
    attribute_code: 'data-amount',
    attribute_name: 'Data Amount',
    attribute_id: 6,
    option_id: 60,
    option_text: '2'
  }
];

// Dictionary of supported attribute codes
const supportedCodes = {
  'data-amount': 'data_amount',
  'day-amount': 'day_amount',
  'data-amount-unit': 'data_amount_unit'
};

/**
 * Transforms variants options based on supported attribute codes.
 *
 * @param {Array} variantsOptions - Array of variant option objects.
 * @param {Object} supportedCodes - Dictionary of supported attribute codes.
 * @returns {Object} - Transformed result object.
 */
function transformVariantsOptions(variantsOptions, supportedCodes) {
  return _.chain(variantsOptions)
    .filter((option) => supportedCodes.hasOwnProperty(option.attribute_code)) // Filter only supported attribute codes
    .keyBy((option) => _.camelCase(supportedCodes[option.attribute_code])) // Use the dictionary to set the output keys
    .mapValues((option) => option.option_text) // Map the option_text as the value
    .value();
}

module.exports = {
  Query: {
    eSimDetails: async ({ esimUUID }, {}, { pool }) => {
      try {
        // todo: cac thong tin cho esim details:
        // 1.) variant prod info: day amount,...
        // 2.) product detail
        // 3.) active code + sm
        const esim = await select()
          .from('esim')
          .where('uuid', '=', esimUUID)
          .load(pool);

        if (!esim) {
          return null;
        }
        const [_, sm_address, code] = esim.lpa.split('$');

      //   const lpaPartial = orderTask.serials?.[0].qrCode?.split('$');
      //   const activeIOSCode = `SM-DP + Address: ${lpaPartial[1]} and Code: ${lpaPartial[2]}`;
      //   return {
      //     sku: orderDetail.itemCode,
      //     iccid: orderTask.serials?.[0].iccid,
      //     qrCode: orderTask.serials?.[0].qrImageUrl,
      //     lpa: orderTask.serials?.[0].qrCode,
      //     iosLpa: activeIOSCode,
      //     androidLpa: orderTask.serials?.[0].qrCode,
      //   };
      // });


      // todo: get product info by order_item_id
        const orderItem = await getOrderItemByID(esim.order_item_id, pool);

        const queryProduct = select();
        queryProduct
          .from('product')
          .select('uuid')
          .select('product_id', 'productId')
          .where('product_id', '=', orderItem.product_id)
        const product = await query.execute(pool);

        const variantsOptions = JSON.parse(orderItem.variant_options);
        const tripText = orderItem.trip;
        return {
          ...variantsOptions,
          lpaToQrCode: esim.lpa,
          iosLpa: code,
          android: esim.lpa,
          activationCode: code,
          sm: sm_address,
          tripText,
          product
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    eSimList: async (_, {}, { customer, pool }) => {
      try {
        // todo: get esim list by customerId
        if (!customer?.customer_id) {
          console.error(`Customer not found: ${customer}`);
          return [];
        }
        const query = select().from('esim');
        query.where('customer_id', '=', customer.customer_id);
        query.orderBy('created_at', 'DESC');
        const esims = await query.execute(pool);
        return esims.map((row) => camelCase(row));
      } catch (error) {
        console.error(error);
        return [];
      }
    }
  },
  eSimItem: {
    productDetailsHTML: async ({ product }, _, { pool, homeUrl }) => {
      // Attributes
      if (!product) {
        return null;
      }
      const productAttributeQuery = select().from(
        'product_attribute_value_index'
      );
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
      productCategoryQuery.where(
        'product_category.product_id',
        '=',
        product.uuid
      );

      const categories = await productCategoryQuery.execute(pool);

      const foundDataType = attributes.find(
        (a) => a.attribute_code === 'data-type'
      );
      const foundExpiration = attributes.find(
        (a) => a.attribute_code === 'expiration'
      );
      const foundSharing = attributes.find(
        (a) => a.attribute_code === 'sharing'
      );
      const foundNetworkType = attributes.find(
        (a) => a.attribute_code === 'network-type'
      );
      const foundNetworkOperator = attributes.find(
        (a) => a.attribute_code === 'network-operator'
      );
      const foundSpeedThrottle = attributes.find(
        (a) => a.attribute_code === 'throttle-speed'
      );
      const foundDailyResetTime = attributes.find(
        (a) => a.attribute_code === 'daily-reset-time'
      );

      const filledDescription = productDetailDescriptionHtmlTemplate
        .replace(
          '{data-type}',
          foundDataType ? foundDataType.attribute_name : 'Data Type'
        )
        .replace(
          '{data-type-value}',
          foundDataType ? foundDataType.option_text : ''
        )
        .replace(
          '{expiration}',
          foundExpiration ? foundExpiration.attribute_name : 'Expiration'
        )
        .replace(
          '{expiration-value}',
          foundExpiration ? foundExpiration.option_text : ''
        )
        .replace(
          '{sharing}',
          foundSharing ? foundSharing.attribute_name : 'Sharing'
        )
        .replace(
          '{sharing-value}',
          foundSharing ? foundSharing.option_text : ''
        )
        .replace('{coverage}', 'Coverage')
        .replace(
          '{coverage-value}',
          categories
            .map(
              (c) =>
                `<div style="display: inline-block; margin-right: 8px; line-height: 2"><img width="28" height="20" style="border-radius: 4px; vertical-align: middle" src="${
                  c.image ? `${homeUrl}${c.image}` : ''
                }" /> <label>${c.name}</label></div>`
            )
            .join('  ')
        )
        .replace(
          '{network-type}',
          foundNetworkType ? foundNetworkType.attribute_name : 'Network Type'
        )
        .replace(
          '{network-type-value}',
          foundNetworkType ? foundNetworkType.option_text : ''
        )
        .replace(
          '{network-operator}',
          foundNetworkOperator
            ? foundNetworkOperator.attribute_name
            : 'Network Operator'
        )
        .replace(
          '{network-operator-value}',
          foundNetworkOperator ? foundNetworkOperator.option_text : ''
        )
        .replace(
          '{speed-throttle}',
          foundSpeedThrottle
            ? foundSpeedThrottle.attribute_name
            : 'Speed Throttle'
        )
        .replace(
          '{speed-throttle-value}',
          foundSpeedThrottle ? foundSpeedThrottle.option_text : ''
        )
        .replace(
          '{daily-reset-time}',
          foundDailyResetTime
            ? foundDailyResetTime.attribute_name
            : 'Daily Reset Time'
        )
        .replace(
          '{daily-reset-time-value}',
          foundDailyResetTime ? foundDailyResetTime.option_text : ''
        );

      return filledDescription;
    }
  }
};
