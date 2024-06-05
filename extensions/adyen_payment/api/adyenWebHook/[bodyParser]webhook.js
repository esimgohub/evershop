/* eslint-disable global-require */
const {
  insert,
  startTransaction,
  update,
  commit,
  rollback,
  select
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { emit } = require('@evershop/evershop/src/lib/event/emitter');
const { hmacValidator: HmacValidator } = require('@adyen/api-library');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { info } = require('@evershop/evershop/src/lib/log/logger');

// eslint-disable-next-line no-unused-vars
module.exports = async (req, res, delegate, next) => {
  const connection = await getConnection();
  const validator = new HmacValidator();
  try {

    // get notificationItems from body
    const notificationRequestItems = req.body.notificationItems;

    // fetch first (and only) NotificationRequestItem
    const notificationRequestItem = notificationRequestItems[0].NotificationRequestItem;
    info(notificationRequestItem);

    const hmacKey = await getSetting('adyenHmacKey', '');

    if (!validator.validateHMAC(notificationRequestItem, hmacKey)) {
      // invalid hmac: webhook cannot be accepted
      res.status(401).send('Invalid HMAC signature');
      return;
    }

    // valid hmac: process event
    if (notificationRequestItem.success === "true") {
      // Process the webhook based on the eventCode
      await startTransaction(connection);
      if (notificationRequestItem.eventCode === "AUTHORISATION") {
        // orderRef === merchantReference
        const orderId = notificationRequestItem.merchantReference;
        // Load the order
        const order = await select()
          .from('order')
          .where('uuid', '=', orderId)
          .load(connection);

        // orderId:grand_total, amount, currency, txn_id (tuy business ma add kieu gi)
        // Update the order
        // Create payment transaction
        await insert('payment_transaction')
          .given({
            payment_transaction_order_id: order.order_id,
            amount: order.grand_total,
            currency: order.currency,
            transaction_type: 'online',
            payment_action: 'Capture'
          })
          .execute(connection);

        // Update the order status
        await update('order')
          .given({ payment_status: 'paid' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Customer paid by using credit card. Transaction ID: ${notificationRequestItem?.additionalData?.checkoutSessionId}`
          })
          .execute(connection);

        // Emit event to add order placed event
        await emit('order_placed', { ...order });
      }
      else {
        info("skipping non actionable webhook");
      }
      await commit(connection);
      // TODO: CANCEL AND REFUND action
    }

    // acknowledge event has been consumed
    res.status(202).send();
  } catch (error) {
    await rollback(connection);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}; 