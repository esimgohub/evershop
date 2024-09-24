const { select, execute } = require('@evershop/postgres-query-builder');

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
