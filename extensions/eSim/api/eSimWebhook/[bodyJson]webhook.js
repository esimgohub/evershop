const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const { emit } = require('@evershop/evershop/src/lib/event/emitter');
const {
  getConnection,
  pool
} = require('@evershop/evershop/src/lib/postgres/connection');
const {
  rollback,
  commit,
  select,
  startTransaction,
  insert
} = require('@evershop/postgres-query-builder');
const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
const {
  getOrderByUUID,
  getOrderItemByID
} = require('../../services/order.service');
module.exports = async (request, response) => {
  const connection = await getConnection();
  const payloadBuffer = request.body;
  const payloadString = payloadBuffer.toString('utf8'); // 'utf8' is the encoding
  const webhookData = JSON.parse(payloadString);

  try {
    await startTransaction(connection);

    const { referenceOrderCode, orderDetails } = webhookData;
    if (!referenceOrderCode || !orderDetails?.length) {
      console.error(`Received webhookData: ${webhookData}`);
      throw new Error('Invalid webhookData');
    }
    // todo: get ORDER by order.uuid
    const order = await getOrderByUUID(referenceOrderCode, connection);
    if (!order) {
      console.error(`Received webhookData: ${webhookData}`);
      throw new Error('Order not found');
    }

    // todo: get Order_item by order order.id
    const items = await getOrderItemByID(order.order_id, connection);

    const dict = new Map();

    // pick order_item match with sku
    orderDetails.forEach((esim) => {
      const { sku } = esim;
      const found = items.find((ite) => ite.product_sku === sku);
      if (found) {
        dict.set(sku, found.order_item_order_id);
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
        .execute(connection);
    }
    //
    await commit(connection);
    response.status(OK);
    response.$body = {
      data: { ...webhookData }
    };
  } catch (e) {
    // if (webhookData?.referenceOrderCode) {
    //   emit('esim_fulfillment', { orderUUID: webhookData.referenceOrderCode });
    // }
    await rollback(connection);
    // todo: trigger api
    response.status(400);
    response.$body = `Webhook Error: ${e.message}`
  }
};
