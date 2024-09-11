const { select } = require('@evershop/postgres-query-builder');

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
  getOrderItemByID: async (id, pool) => {
    const items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', id)
      .execute(pool);
    if (!items) {
      return null;
    }
    return items;
  },
}