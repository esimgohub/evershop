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
} = require('../../services/esim.service');
module.exports = async (request, response, delegate, next) => {
  const connection = await getConnection();

  try {
    await startTransaction(connection);
    const payloadBuffer = request.body;
    const payloadString = payloadBuffer.toString('utf8'); // 'utf8' is the encoding
    const webhookData = JSON.parse(payloadString);

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
    // order_item_id + lpa

    // Save eSim
    for (const esim of orderDetails) {
      // Process orderItem as needed
      const { lpa, sku } = esim;
      if (!lpa || !sku) {
        console.error(
          `referenceOrderCode: ${referenceOrderCode} - Invalid OrderDetail: ${orderDetails}`
        );
        throw new Error('Invalid OrderDetail of webhookData');
      }

      await insert('esim')
        .given({
          lpa,
          order_item_id: dict[sku],
          customer_id: order.customer_id
        })
        .execute(connection);
    }
    //
    await commit(connection);
    // Return a response to acknowledge receipt of the event
    response.status(OK).send(webhookData);
  } catch (e) {
    // failed
    await rollback(connection);
    // todo: trigger api
    // emit('esim_fulfillment', { orderId: order.order_id });
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
};
