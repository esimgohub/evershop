const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const { getOrderItemByItemID } = require('../../../services/order.service');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { select, insert } = require('@evershop/postgres-query-builder');
const _ = require('lodash');
const {
  productDetailDescriptionHtmlTemplate
} = require('@evershop/evershop/src/modules/catalog/utils/product-detail');

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
    .mapValues((option) => {
      if (option.attribute_code === 'data-amount') {
        return option.option_text?.toLowerCase() === 'unlimited'
          ? 'Unlimited'
          : Number(option.option_text).toString();
      }
      if (option.attribute_code === 'day-amount') {
        return Number(option.option_text).toString();
      }
      return option.option_text;
    }) // Map the option_text as the value
    .value();
}

function getUniqueVal(esims) {
  return _.uniqBy(esims, 'order_item_id');
}

module.exports = {
  Query: {
    eSimDetails: async (_, { esimUUID }, { pool, homeUrl }) => {
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

        // todo: get product info by order_item_id
        const orderItem = await getOrderItemByItemID(esim.order_item_id, pool);

        const queryProduct = select();
        queryProduct
          .from('product')
          .select('parent_product_id', 'productId')
          .select('parent_product_uuid', 'uuid')
          .where('product_id', '=', orderItem[0].product_id);
        const product = await queryProduct.execute(pool);

        const categoryDescriptionQuery = select().from('category_description');

        const categoryId = orderItem[0]?.category_id;
        let countryImg = null;
        let countryName = null;

        categoryDescriptionQuery.where(
          'category_description_id',
          '=',
          categoryId
        );
        const rows = await categoryDescriptionQuery.execute(pool);
        const cateObj = { ...rows[0] };
        countryImg = cateObj.image ? `${homeUrl}${cateObj.image}` : null;
        countryName = cateObj.name ?? null;
        let variantsOptions = null;
        let tripText = null;
        if (orderItem?.length && orderItem[0]?.variant_options) {
          variantsOptions = transformVariantsOptions(
            JSON.parse(orderItem[0].variant_options),
            supportedCodes
          );
          // todo: totalDataAmount
          if (variantsOptions.dataAmount === 'Unlimited') {
            variantsOptions.totalDataAmount = 'Unlimited';
          } else {
            const dataA = Number(variantsOptions.dataAmount);
            const dayA = Number(variantsOptions.dayAmount);
            if (typeof dayA === 'number' && typeof dataA === 'number') {
              let total = dataA * dayA;
              if (total >= 1024) {
                variantsOptions.totalDataAmount = `${total / 1000}GB`;
              } else {
                variantsOptions.totalDataAmount = `${total}${variantsOptions.dataAmountUnit}`;
              }
            } else {
              variantsOptions.totalDataAmount = null;
            }
          }
        }
        if (orderItem[0]?.trip) {
          tripText = orderItem[0].trip;
        }
        const isExpired = dayjs(esim.expiry_date).utc().isBefore(dayjs().utc());

        return {
          ...variantsOptions,
          countryImg,
          countryName,
          lpaToQrCode: esim.lpa,
          iosLpa: code,
          androidLpa: esim.lpa,
          activationCode: code,
          smAddress: sm_address,
          expired: isExpired,
          tripText,
          product: product?.length ? product[0] : null,
          dayLeft: Math.max(dayjs(esim.expiry_date).diff(dayjs(), 'day'), 0) // Calculate days left
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    eSimList: async (_, {}, { customer, homeUrl, pool }) => {
      try {
        if (!customer?.customer_id) {
          console.error(`Customer not found: ${customer}`);
          return [];
        }
        const query = select().from('esim');
        query.where('customer_id', '=', customer.customer_id);
        query.orderBy('created_at', 'DESC');
        const esims = await query.execute(pool);

        if (!esims || !esims?.length) {
          return [];
        }

        // todo: pick unique order_item_id
        const uniqueList = getUniqueVal(esims);
        const seen = {};

        for (const item of uniqueList) {
          let variantsOptions = null;
          let countryImg = null;
          let countryName = null;

          const orderItem = await getOrderItemByItemID(
            item.order_item_id,
            pool
          );

          const categoryDescriptionQuery = select().from(
            'category_description'
          );

          const categoryId = orderItem[0]?.category_id;
          categoryDescriptionQuery.where(
            'category_description_id',
            '=',
            categoryId
          );
          const rows = await categoryDescriptionQuery.execute(pool);
          const cateObj = { ...rows[0] };
          countryImg = cateObj.image ? `${homeUrl}${cateObj.image}` : null;
          countryName = cateObj.name ?? null;

          if (orderItem?.length && orderItem[0]?.variant_options) {
            variantsOptions = transformVariantsOptions(
              JSON.parse(orderItem[0].variant_options),
              supportedCodes
            );
            // todo: totalDataAmount
            if (variantsOptions.dataAmount === 'Unlimited') {
              variantsOptions.totalDataAmount = 'Unlimited';
            } else {
              const dataA = Number(variantsOptions.dataAmount);
              const dayA = Number(variantsOptions.dayAmount);
              if (typeof dayA === 'number' && typeof dataA === 'number') {
                const total = dataA * dayA;
                if (total >= 1024) {
                  variantsOptions.totalDataAmount = `${total / 1000}GB`;
                } else {
                  variantsOptions.totalDataAmount = `${total}${variantsOptions.dataAmountUnit}`;
                }
              } else {
                variantsOptions.totalDataAmount = null;
              }
            }
          }
          const isExpired = dayjs(item.expiry_date)
            .utc()
            .isBefore(dayjs().utc());
          // todo: tong hop thong tin ve order_item_id
          seen[item.order_item_id] = {
            ...variantsOptions,
            countryImg,
            countryName,
            expired: isExpired,
            dayLeft: Math.max(dayjs(item.expiry_date).diff(dayjs(), 'day'), 0) // Calculate days left
          };
        }
        const ans = [];
        for (const e of esims) {
          const getObj = seen[e.order_item_id];
          ans.push({
            ...getObj,
            esimUUID: e.uuid
          });
        }

        return ans;
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
