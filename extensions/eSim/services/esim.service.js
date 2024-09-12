const { info } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const axios = require('axios');
const { getOrderByUUID, getOrderItemByOrderID } = require('./order.service');
const dayjs = require('dayjs');
const { insert } = require('@evershop/postgres-query-builder');

module.exports = {
  sendFulfillEsim: async (orderUUID, pool) => {
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

    if (response.status > 209) {
      throw new Error(response?.statusText);
    }

    const { data: responseData } = response;
    info(`send esim fulfillment axios response data: ${responseData} `);

    const { referenceOrderCode, orderDetails } = responseData;
    if (!referenceOrderCode || !orderDetails?.length) {
      console.error(`Received responseData: ${responseData}`);
      throw new Error('Invalid responseData');
    }
    // todo: get ORDER by order.uuid
    const order = await getOrderByUUID(referenceOrderCode, pool);
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
    //
  }
};
