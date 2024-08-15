const Stripe = require('stripe');
const fetch = require('node-fetch');
const { select } = require('@evershop/postgres-query-builder');
const { camelCase } = require('@evershop/evershop/src/lib/util/camelCase');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { buildUrl } = require('@evershop/evershop/src/lib/router/buildUrl');
const {
  createAttribute,
  createCategory,
  createTitleInfo,
  createTripInfo
} = require('@evershop/evershop/src/modules/oms/services/getAdditionalOrderInfo');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
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
    paymentDetails: async ({ orderId, paymentMethod, stripePaymentMethodId }, _, { pool }) => {
      const result = null;
      // get txnId form pay_txn by order id
      const paymentTransaction = await select()
        .from('payment_transaction')
        .where('payment_transaction_order_id', '=', orderId)
        .load(pool);

      if (!paymentTransaction?.transaction_id) {
        return null;
      }

      switch (paymentMethod) {
        case 'tazapay': {
          const accessKey = await getSetting('tazapayAccessKey', '');
          const secretKey = await getSetting('tazapaySecretKey', '');
          const userPwd = `${accessKey}:${secretKey}`;
          const authBasic = `Basic ${Buffer.from(userPwd).toString('base64')}`;
          const baseUrl = await getSetting('tazapayBaseUrl', null);
          if (!baseUrl) {
            return null;
          }
          const endpoint = `${baseUrl}/v3/payment_attempt/${paymentTransaction.transaction_id}`;
          const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              authorization: authBasic
            }
          };

          const response = await fetch(endpoint, options)
            .then(res => res.json())
            .catch(() => null);

          if (!response?.data?.payment_method_details) {
            return null;
          }
          const paymentDetails = response.data.payment_method_details;
          if (paymentDetails?.type === 'card' && paymentDetails?.card) {
            return {
              type: paymentDetails.type,
              details: {
                last4: paymentDetails.card.last4,
                brand: paymentDetails.card.scheme,
                expMonth: paymentDetails.card.expiry?.month,
                expYear: paymentDetails.card.expiry?.year
              }
            };
          }
          break;
        }
        case 'stripe': {
          const stripeSecretKey = await getSetting('stripeSecretKey', '');

          if (!stripePaymentMethodId || !stripeSecretKey) {
            return null;
          }
          const stripeInstance = new Stripe(stripeSecretKey);
          const paymentMethod = await stripeInstance.paymentMethods.retrieve(
            stripePaymentMethodId
          );

          if (!paymentMethod) {
            return null;
          }
          // TODO: check payment type
          return {
            type: 'card',
            details: {
              last4: paymentMethod.card.last4,
              brand: paymentMethod.card.brand,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year
            }
          };
        }
        default:
          break;
      }
      return result;
    },
    items: async ({ orderId }, _, { pool }) => {
      const items = await select()
        .from('order_item')
        .where('order_item_order_id', '=', orderId)
        .execute(pool);
      const itemsCamelCaseField = items.map((item) => camelCase(item));
      const addtionalInfoArr = itemsCamelCaseField.map((async (item) => {
        const product = await select()
          .from('product')
          .where('product_id', '=', item?.productId)
          .and('status', '=', 1)
          .load(pool);
        const productAttributeObj = await createAttribute(product, pool);

        const titleInfoObj = await createCategory(item?.categoryId, pool);

        const titleInfo = await createTitleInfo(productAttributeObj, titleInfoObj);
        const tripInfo = await createTripInfo(item?.trip);
        // eslint-disable-next-line no-param-reassign
        item.titleInfo = titleInfo;
        // eslint-disable-next-line no-param-reassign
        item.tripText = tripInfo;

        return {
          ...item
        };
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
      const query = select().from('order');
      query.where('customer_id', '=', customerId);
      query.orderBy('created_at', 'DESC');
      const orders = await query.execute(pool);

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
