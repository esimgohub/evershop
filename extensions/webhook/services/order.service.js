const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');
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
const { error } = require('@evershop/evershop/src/lib/log/logger');

module.exports = {
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
          console.log('orderDetailData', orderDetailData, sku);
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
