const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { insert, update, execute } = require('@evershop/postgres-query-builder');
const { info } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const axios = require('axios');
const {
  getOrderByOrderNum,
  getOrderItemByOrderID
} = require('./order.service');
const dayjs = require('dayjs');

module.exports = {
  sendFulfillEsim: async (orderUUID) => {
    // GET request to get esim by REFERENCE order code
    info(
      `send esim fulfillment by reference order code: ${JSON.stringify(
        orderUUID
      )}`
    );

    const gohubCloudBaseUrl = getConfig('webhook.gohub_cloud_base_url');
    const gohubCloudApiKey = getConfig('webhook.gohub_cloud_api_key');

    const response = await axios.get(
      `${gohubCloudBaseUrl}/b2c/orders/${orderUUID}/serials`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': gohubCloudApiKey
        }
      }
    );

    if (response.status > 209 || !response?.data?.data) {
      throw new Error(response?.statusText);
    }

    const { data: responseData } = response.data;
    info(`send esim fulfillment axios response data: ${responseData} `);
    const { referenceOrderCode, orderDetails } = responseData;

    if (!referenceOrderCode || !orderDetails?.length) {
      console.error(`Received responseData: ${responseData}`);
      throw new Error('Invalid responseData');
    }
    // todo: get ORDER by order.uuid
    const order = await getOrderByOrderNum(referenceOrderCode, pool);
    if (!order) {
      console.error(`Received responseData: ${responseData}`);
      throw new Error('Order not found');
    }

    // todo: get Order_item by order order.id
    const items = await getOrderItemByOrderID(order.order_id, pool);
    const dict = new Map();

    // pick order_item match with sku
    orderDetails.forEach((esim) => {
      const { sku } = esim;
      const found = items.find((ite) => ite.product_sku === sku);
      if (found) {
        dict.set(sku, found.order_item_id);
      }
    });

    // todo: insert into esim table by order OrderDetails from webhook:
    for (const esim of orderDetails) {
      const { lpa, sku } = esim;
      if (!lpa || !sku) {
        console.error(
          `referenceOrderCode: ${referenceOrderCode} - Invalid OrderDetail: ${orderDetails}`
        );
        throw new Error('Invalid OrderDetail of webhookData');
      }

      const expiryDate = dayjs(order.created_at).add(30, 'day').utc().format(); // Converts to UTC format

      await insert('esim')
        .given({
          lpa,
          order_item_id: dict.get(sku),
          customer_id: order.customer_id,
          expiry_date: expiryDate
        })
        .execute(pool);
    }
    await update('order')
      .given({ fulfillment_status: 'Completed' })
      .where('order_id', '=', order.order_id)
      .execute(pool);
  },
  getEsimDataType: async (productId, pool) => {
    if (!productId) {
      return null;
    }
    const rawQuery = `
    select
      *
    from
      product_attribute_value_index pavi
    where
      product_id = (
      select
      p.parent_product_id
      from
      product p
      where
      p.product_id = '${productId}'
    )
      and attribute_id in (
      select
      ao.attribute_id
      from
      attribute_option ao
      where
      ao.attribute_code = 'data-type'
    )
    `;
    const { rows } = await execute(pool, rawQuery);
    return rows?.length ? rows[0]?.option_text : null;
  }
};
