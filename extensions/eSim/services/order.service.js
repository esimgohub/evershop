const { select } = require('@evershop/postgres-query-builder');

module.exports = {
  getOrderByOrderNum: async (uuid, pool) => {
    const query = select();
    query.from('order');
    query.andWhere('order.order_number', '=', uuid);
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
