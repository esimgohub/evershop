const { select } = require('@evershop/postgres-query-builder');
const dayjs = require('dayjs');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');

module.exports = exports = {};
// eslint-disable-next-line no-unused-vars
exports.createAttribute = async function createAttribute(product, pool) {
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
    product?.product_id
  );
  const productAttributes = await productAttributeQuery.execute(pool);

  // if product is variant
  const isVariableProduct = product?.type === 'variable';
  if (isVariableProduct) {
    return productAttributes.reduce((response, attribute) => {
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
    product?.parent_product_id
  );
  const productVariantAttributes = await productVariantAttributeQuery.execute(pool);

  const attributes = [...productAttributes, ...productVariantAttributes];

  const responses = attributes.reduce((response, attribute) => {
    response[attribute.attribute_code] = attribute.option_text;

    return response;
  }, {});

  const foundDataType = Object.entries(responses).find(([key, value]) => key === 'data-type');
  if (!foundDataType) {
    console.log('Data type not found');
    return {}
  }

  const foundDayAmount = Object.entries(responses).find(([key, value]) => key === 'day-amount');
  if (!foundDayAmount) {
    console.log('Day amount not found');
    return {}
  }

  const foundDataAmount = Object.entries(responses).find(([key, value]) => key === 'data-amount');
  if (!foundDataAmount) {
    console.log('Data amount not found');
    return {}
  }

  responses['data-amount'] = foundDataAmount[1].toLowerCase() === 'unlimited' ? -1 : parseFloat(foundDataAmount[1]);
  responses['day-amount'] = parseFloat(foundDayAmount[1]);

  return responses;
};

exports.createCategory = async function createCategory(categoryId, pool) {
  const homeUrl = getConfig('shop.homeUrl', 'http://localhost:3000');

  const categoryDescriptionQuery = select().from('category_description');

  if (categoryId == null) {
    return {};
  }
  categoryDescriptionQuery.where('category_description_id', '=', categoryId);
  const rows = await categoryDescriptionQuery.execute(pool);
  if (!rows?.length) {
    return {};
  }
  const cateObj = { ...rows[0] };
  return {
    ...cateObj,
    image: cateObj.image ? `${homeUrl}${cateObj.image}` : null
  };
};

exports.createTitleInfo = async function createTitleInfo(attrObj, cateObj) {
  if (!cateObj || !cateObj?.name || !cateObj?.image || !attrObj || !attrObj?.['data-amount'] || !attrObj?.['data-type'] || !attrObj?.['day-amount']) {
    return null;
  }
  return {
    dataAmount: attrObj['data-amount'] != null ? parseFloat(attrObj['data-amount']): null,
    dataAmountUnit: attrObj['data-amount-unit'],
    dataType: attrObj['data-type'],
    dayAmount: attrObj['day-amount'] != null ? parseFloat(attrObj['day-amount']) : null,
    categoryName: cateObj.name,
    imgUrl: `${cateObj.image}`,
    imgAlt: cateObj.name
  };
};

exports.createTripInfo = async function createTripInfo(trip) {
  function formatDateComponent(value) {
    return String(value).padStart(2, '0');
  }

  function convertTimestampToTripString(fromDate, toDate) {
    // Create dayjs objects from the timestamps
    const fromDateObj = dayjs(fromDate);
    const toDateObj = dayjs(toDate);

    // Get day, month, and year components for both dates
    const fromDay = formatDateComponent(fromDateObj.date());

    const toDay = formatDateComponent(toDateObj.date());
    const toMonth = formatDateComponent(toDateObj.month() + 1);
    const toYear = toDateObj.year();


    // Calculate the number of days between fromDate and toDate
    const diffDays = toDateObj.diff(fromDateObj, 'day') + 1;

    // Determine whether to use "day" or "days"
    const dayText = diffDays === 1 ? 'day' : 'days';

    // Format the trip string
    return `Trip: ${fromDay}-${toDay}/${toMonth}/${toYear} (${diffDays} ${dayText})`;
  }

  if (!trip || typeof trip !== 'string' || trip.split(',').length < 2) {
    return '';
  }
  const tripArr = trip.split(',');
  return convertTimestampToTripString(Number(tripArr[0]), Number(tripArr[1]));
};