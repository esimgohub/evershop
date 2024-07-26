const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { select, update } = require('@evershop/postgres-query-builder');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const axios = require('axios');
const { orderSource } = require('../../constants/order-source');

module.exports = async function sendFulfillOrder(data) {
  try {
    const orderId = data.order_id;
    info(`sendFulfillOrder data: ${orderId}`);

    const orderQuery = select('odr.order_id')
      .select('odr.order_number', 'order_number')
      .select('odr.customer_email', 'order_email')
      .select('odr.shipping_address_id', 'shipping_address_id')
      .select('odr.billing_address_id', 'billing_address_id')
      .select('odr.payment_status', 'payment_status')
      .select('customer.email', 'customer_email')
      .select('customer.first_name', 'customer_first_name')
      .select('customer.last_name', 'customer_last_name')
      .from('order', 'odr');

    orderQuery
      .leftJoin('customer')
      .on('customer.customer_id', '=', 'odr.customer_id');

    orderQuery.where('odr.order_id', '=', orderId);

    const order = await orderQuery.load(pool);
    if (!order) {
      return;
    }

    order.items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', orderId)
      .execute(pool);

    const orderDetailsPayload = order.items.map((item) => {
      return {
        itemCode: item.product_sku,
        quantity: item.qty
      };
    });

    const orderPayload = {
      referenceOrderCode: order.order_number,
      source: orderSource.b2b,
      shippingFirstName: order.customer_first_name,
      shippingLastName: order.customer_last_name,
      shippingPhone: '0932198705',
      shippingEmail: order.order_email || order.customer_email,
      language: 'en',
      paymentStatus: order.payment_status,
      orderDetails: orderDetailsPayload
    };

    info(`sendFulfillOrder order payload: ${JSON.stringify(orderPayload)}`);

    const gohubCloudBaseUrl = getConfig('webhook.gohub_cloud_base_url');
    const gohubCloudApiKey = getConfig('webhook.gohub_cloud_api_key');

    const response = await axios.post(
      `${gohubCloudBaseUrl}/webhooks/b2c/payments`,
      orderPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': gohubCloudApiKey
        }
      }
    );

    const { data: responseData } = response;
    info(
      `sendFulfillOrder axios response data: ${JSON.stringify(responseData)} `
    );

    await update('order')
      .given({ fulfillment_status: 'Processing' })
      .where('order_id', '=', orderId)
      .execute(pool);
  } catch (e) {
    error(e.message);
    throw e;
  }
};
