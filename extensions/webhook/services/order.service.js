const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  select,
  update,
  commit,
  rollback,
  startTransaction
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const axios = require('axios');
const { orderSource } = require('../constants/order-source');

module.exports = {
  sendFulfillOrder: async function (orderId) {
    info(`sendFulfillOrder data: ${orderId}`);

    const orderQuery = select('odr.order_id')
      .select('odr.order_number', 'order_number')
      .select('odr.customer_email', 'order_email')
      .select('odr.shipping_address_id', 'shipping_address_id')
      .select('odr.billing_address_id', 'billing_address_id')
      .select('odr.payment_status', 'payment_status')
      .select('odr.sub_total_old_price', 'sub_total_old_price')
      .select('odr.sub_total_discount_amount', 'sub_total_discount_amount')
      .select('odr.grand_total', 'grand_total')
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

    order.shipping_address = await select()
      .from('order_address')
      .where('order_address_id', '=', order.shipping_address_id)
      .load(pool);

    const orderDetailsPayload = order.items.map((item) => {
      return {
        itemCode: item.product_sku,
        quantity: item.qty,
        price: parseFloat(item.final_price),
        discount: parseFloat(item.discount_amount)
      };
    });

    const orderPayload = {
      referenceOrderCode: order.order_number,
      source: orderSource.b2b,
      shippingFirstName: order.customer_first_name,
      shippingLastName: order.customer_last_name,
      shippingPhone: order.shipping_address?.telephone || '',
      shippingEmail: order.order_email || order.customer_email,
      language: 'en',
      paymentStatus: order.payment_status,
      orderDetails: orderDetailsPayload,
      subTotal: parseFloat(order.sub_total_old_price),
      totalDiscount: parseFloat(order.sub_total_discount_amount),
      total: parseFloat(order.grand_total)
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

    if (![200, 201].includes(response.status)) {
      throw new Error(response?.statusText);
    }

    await update('order')
      .given({ fulfillment_status: 'Processing' })
      .where('order_id', '=', orderId)
      .execute(pool);
  },
  getOneOrder: async function (orderNumber, referenceOrderCode) {
    const getOrderByIdQuery = select().from('order');
    getOrderByIdQuery.where('order.order_number', '=', orderNumber);

    getOrderByIdQuery.where(
      'order.reference_order_number',
      '=',
      referenceOrderCode
    );

    const order = await getOrderByIdQuery.load(pool);
    return order;
  },

  updateOrderById: async function (orderNumber, data) {
    const { referenceOrderCode, status, orderDetails } = data;
    const order = await this.getOneOrder(orderNumber, referenceOrderCode);
    if (!order) {
      throw new Error('Order not found');
    }

    const connection = await getConnection();
    try {
      await startTransaction(connection);

      await update('order')
        .given({
          fulfillment_status: status
        })
        .where('order.order_number', '=', orderNumber)
        .and('order.reference_order_number', '=', referenceOrderCode)
        .execute(pool);

      if (orderDetails?.length !== 0) {
        const updateOrderItemQueries = orderDetails.map((orderDetail) => {
          const { sku, ...orderDetailData } = orderDetail;
          return update('order_item')
            .given({
              serial: {
                iccid: orderDetailData.iccid,
                lpa: orderDetailData.lpa,
                qrCode: orderDetailData.qrCode,
                iosLpa: orderDetailData.iosLpa,
                androidLpa: orderDetailData.androidLpa
              }
            })
            .where('order_item.order_item_order_id', '=', order.order_id)
            .and('order_item.product_sku', '=', sku)
            .execute(pool);
        });

        await Promise.all(updateOrderItemQueries);
      }

      commit(connection);
    } catch (e) {
      error(e.message);
      rollback(connection);
      throw e;
    }
  }
};
