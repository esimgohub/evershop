const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const { createAttribute, createCategory, createTitleInfo, createTripInfo } = require('@evershop/evershop/src/modules/oms/services/getAdditionalOrderInfo');
const { getOrdersBaseQuery } = require('../../../services/getOrdersBaseQuery');

module.exports = {
  Query: {
    order: async (_, { uuid }, { pool }) => {
      const query = getOrdersBaseQuery();
      query.where('uuid', '=', uuid);
      const order = await query.load(pool);
      if (!order) {
        return null;
      } else {
        return camelCase(order);
      }
    },
    shipmentStatusList: () => getConfig('oms.order.shipmentStatus', {}),
    paymentStatusList: () => getConfig('oms.order.paymentStatus', {})
  },
  Order: {
    items: async ({ orderId }, _, { pool }) => {
      const items = await select()
        .from('order_item')
        .where('order_item_order_id', '=', orderId)
        .execute(pool);
      const itemsCamelCaseField = items.map((item) => camelCase(item))
      const addtionalInfoArr = itemsCamelCaseField.map((async (item) => {
        const product = await select()
          .from('product')
          .where('product_id', '=', item?.productId)
          .and('status', '=', 1)
          .load(pool);
        const productAttributeObj = await createAttribute(product, pool)

        const titleInfoObj = await createCategory(item?.categoryId, pool);

        const titleInfo = await createTitleInfo(productAttributeObj, titleInfoObj)
        const tripInfo  = await createTripInfo(item?.trip)
        // eslint-disable-next-line no-param-reassign
        item.titleInfo = titleInfo;
        // eslint-disable-next-line no-param-reassign
        item.tripText= tripInfo;

        return {
          ...item
        }
      }));
      return addtionalInfoArr;
    },
    shippingAddress: async ({ shippingAddressId }, _, { pool }) => {
      const address = await select()
        .from('order_address')
        .where('order_address_id', '=', shippingAddressId)
        .load(pool);
      return address ? camelCase(address) : null;
    },
    billingAddress: async ({ billingAddressId }, _, { pool }) => {
      const address = await select()
        .from('order_address')
        .where('order_address_id', '=', billingAddressId)
        .load(pool);
      return address ? camelCase(address) : null;
    },
    activities: async ({ orderId }, _, { pool }) => {
      const query = select().from('order_activity');
      query.where('order_activity_order_id', '=', orderId);
      query.orderBy('order_activity_id', 'DESC');
      const activities = await query.execute(pool);
      return activities
        ? activities.map((activity) => camelCase(activity))
        : null;
    },
    shipment: async ({ orderId, uuid }, _, { pool }) => {
      const shipment = await select()
        .from('shipment')
        .where('shipment_order_id', '=', orderId)
        .load(pool);
      return shipment ? { ...camelCase(shipment), orderUuid: uuid } : null;
    },
    shipmentStatus: ({ shipmentStatus }) => {
      const statusList = getConfig('oms.order.shipmentStatus', {});
      const status = statusList[shipmentStatus] || {
        name: 'Unknown',
        code: shipmentStatus,
        badge: 'default',
        progress: 'incomplete'
      };

      return {
        ...status,
        code: shipmentStatus
      };
    },
    paymentStatus: ({ paymentStatus }) => {
      const statusList = getConfig('oms.order.paymentStatus', {});
      const status = statusList[paymentStatus] || {
        name: 'Unknown',
        code: paymentStatus,
        badge: 'default',
        progress: 'incomplete'
      };

      return {
        ...status,
        code: paymentStatus
      };
    }
  },
  Customer: {
    orders: async ({ customerId }, _, { pool }) => {
      const orders = await select()
        .from('order')
        .where('order.customer_id', '=', customerId)
        .execute(pool);
      return orders.map((row) => camelCase(row));
    }
  },
  OrderItem: {
    productUrl: async ({ productId }, _, { pool }) => {
      const product = await select()
        .from('product')
        .where('product_id', '=', productId)
        .load(pool);
      return product ? buildUrl('productEdit', { id: product.uuid }) : null;
    }
  }
};
