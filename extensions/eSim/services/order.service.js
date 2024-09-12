const { select } = require('@evershop/postgres-query-builder');
const { info } = require('@evershop/evershop/src/lib/log/logger');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const axios = require('axios');

module.exports = {
  getOrderByUUID: async (uuid, pool) => {
    const query = select();
    query.from('order');
    query.andWhere('order.uuid', '=', uuid);
    const order = await query.load(pool);
    if (!order) {
      return null;
    }
    return order;
  },
  getOrderItemByOrderID: async (id, pool) => {
    const items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', id)
      .execute(pool);
    if (!items) {
      return null;
    }
    return items;
  },
  getOrderItemByItemID: async (id, pool) => {
    const items = await select()
      .from('order_item')
      .where('order_item_id', '=', id)
      .execute(pool);
    if (!items) {
      return null;
    }
    return items;
  }

};
