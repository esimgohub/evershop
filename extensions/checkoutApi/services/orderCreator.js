const {
  commit,
  getConnection,
  insert,
  rollback,
  select,
  startTransaction,
  update,
  execute
} = require('@evershop/postgres-query-builder');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const randomStr = require('@evershop/evershop/src/modules/base/services/randomStr');

/* Default validation rules */
let validationServices = [
  {
    id: 'checkCartError',
    /**
     *
     * @param {Cart} cart
     * @param {*} validationErrors
     * @returns
     */
    func: (cart, validationErrors) => {
      if (cart.hasError()) {
        validationErrors.push(cart.error);
        return false;
      } else {
        return true;
      }
    }
  },
  {
    id: 'checkEmpty',
    /**
     *
     * @param {Cart} cart
     * @param {*} validationErrors
     * @returns
     */
    func: (cart, validationErrors) => {
      const items = cart.getItems();
      if (items.length === 0) {
        validationErrors.push('Cart is empty');
        return false;
      } else {
        return true;
      }
    }
  }
];

const validationErrors = [];

// eslint-disable-next-line no-multi-assign
module.exports = exports = {};
// eslint-disable-next-line no-unused-vars
exports.createOrder = async function createOrder(cart) {
  // Start creating order
  const connection = await getConnection(pool);
  const paymentStatusList = getConfig('oms.order.paymentStatus', {});
  try {
    await startTransaction(connection);

    // eslint-disable-next-line no-restricted-syntax
    for (const rule of validationServices) {
      // eslint-disable-next-line no-await-in-loop
      if ((await rule.func(cart, validationErrors)) === false) {
        throw new Error(validationErrors);
      }
    }

    // Save the billing address
    const cartBillingAddress = await select()
      .from('cart_address')
      .where('cart_address_id', '=', cart.getData('billing_address_id'))
      .load(connection);
    delete cartBillingAddress.uuid;
    const billAddr = await insert('order_address')
      .given(cartBillingAddress)
      .execute(connection);

    // Save order to DB
    const previous = await select('order_id')
      .from('order')
      .orderBy('order_id', 'DESC')
      .limit(0, 1)
      .execute(connection);

    let defaultPaymentStatus = null;
    Object.keys(paymentStatusList).forEach((key) => {
      if (paymentStatusList[key].isDefault) {
        defaultPaymentStatus = key;
      }
    });

    const items = cart.getActiveItems();
    const nextCart = { ...cart.exportData() };
    let itemCount = 0;
    items.forEach((i) => {
      itemCount += parseInt(i.getData('qty'), 10);
    });

    nextCart.total_qty = itemCount;
    const orderRef = `AP${randomStr(5)}`;

    const order = await insert('order')
      .given({
        ...nextCart,
        uuid: uuidv4().replace(/-/g, ''),
        order_number: orderRef,
        // FIXME: Must be structured
        billing_address_id: billAddr.insertId,
        payment_status: defaultPaymentStatus
      })
      .execute(connection);

    const customerId = Number(order.customer_id)
    if (order.coupon) {
      const couponFounded = await select()
        .from('customer_coupon_use')
        .where('customer_coupon_use.customer_id', '=', customerId)
        .andWhere('customer_coupon_use.coupon', '=', order.coupon)
        .load(connection);
      if (!couponFounded) {
        await insert('customer_coupon_use')
          .given({
            customer_id: customerId,
            coupon: order.coupon,
            used_time: 1
          })
          .execute(connection);
      } else {
        await update('customer_coupon_use')
          .given({
            used_time: couponFounded.used_time + 1
          })
          .where('customer_coupon_use.customer_id', '=', customerId)
          .andWhere('customer_coupon_use.coupon', '=', order.coupon)
          .execute(connection);
      }
    }

    // Save order items
    await Promise.all(
      items.map(async (item) => {
        const { is_active, ...itemData } = item.export(); // Destructure to remove 'is_active'
        await insert('order_item')
          .given({
            ...itemData,
            uuid: uuidv4().replace(/-/g, ''),
            order_item_order_id: order.insertId
          })
          .execute(connection);
      })
    );

    // Save order activities
    await insert('order_activity')
      .given({
        order_activity_order_id: order.insertId,
        comment: 'Order created',
        customer_notified: 0 // TODO: check config of SendGrid
      })
      .execute(connection);

    // Disable the cart
    await update('cart')
      .given({ status: 0 })
      .where('cart_id', '=', cart.getData('cart_id'))
      .execute(connection);
    // Load the created order
    const createdOrder = await select()
      .from('order')
      .where('order_id', '=', order.insertId)
      .load(connection);

    await commit(connection);
    return createdOrder.uuid;
  } catch (e) {
    await rollback(connection);
    throw e;
  }
};

exports.addCreateOrderValidationRule = function addCreateOrderValidationRule(
  id,
  func
) {
  if (typeof obj !== 'function') {
    throw new Error('Validator must be a function');
  }

  validationServices.push({ id, func });
};

exports.removeCreateOrderValidationRule =
  function removeCreateOrderValidationRule(id) {
    validationServices = validationServices.filter((r) => r.id !== id);
  };
