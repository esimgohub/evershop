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
const { debug } = require('@evershop/evershop/src/lib/log/logger');
const { display } = require('zero-decimal-currencies');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { error} = require('@evershop/evershop/src/lib/log/logger');
const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  const connection = await getConnection();
  try {
    const payloadBuffer = request.body;
    const payloadString = payloadBuffer.toString('utf8'); // 'utf8' is the encoding
    const webhookData = JSON.parse(payloadString);
    
    await startTransaction(connection);
    const txnData = webhookData.data;
    // eslint-disable-next-line no-case-declarations
    // Load the order
    if (!txnData) {
      error('Tazapay - Transaction data is empty');
      throw new Error('Tazapay - Transaction data is empty');
    }

    const order = await select()
      .from('order')
      .where('uuid', '=', txnData.reference_id)
      .load(connection);

    if (!order) {
      error(`Tazapay - Order not found with order uuid: ${txnData.reference_id}`);
      throw new Error(`Tazapay - Order not found with order uuid: ${txnData.reference_id}`);
    }

    // Handle the event
    // todo: handle other event types: payment_attempt.failed, payment_attempt.succeeded, payment_method.processing
    switch (webhookData.type) {
      case 'payment_attempt.succeeded': {
        // avoid `checkout.paid` and `payment_attempt.succeeded` to be processed twice on the same order
        const { amount, charge_currency, id } = txnData;

        // Update the order
        // Create payment transaction
        if (order.payment_status === 'paid') {
          break;
        }
        await insert('payment_transaction')
          .given({
            amount: parseFloat(
              display(amount, charge_currency)
            ),
            payment_transaction_order_id: order.order_id,
            transaction_id: id,
            transaction_type: 'online',
            payment_action: 'Capture'
          })
          .execute(connection);

        // Update the order status
        await update('order')
          .given({
            payment_status: 'paid',

          })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Customer paid by using credit card. Tazapay PaymentAttemptId: ${id}`
          })
          .execute(connection);

        // Emit event to add order placed event
        await emit('order_placed', { ...order });
        await emit('payment_status_changed', { ...order });

        break;
      }

      case 'payment_attempt.failed': {
        debug(`Tazapay - Payment txn was failed with PaymentAttemptId: ${txnData.id}`);
        // Update the order status
        await update('order')
          .given({ payment_status: 'failed' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Tazapay payment method was failed. PaymentMethodId: ${txnData.payin}`
          })
          .execute(connection);

        await emit('payment_status_changed', { ...order });
        break;
      }

      // todo: handle expired event
      // case 'checkout.expired': {
      //   debug(`Tazapay - Payment txn was expired with PaymentMethodId: ${txnData.id}`);
      //   // Update the order status
      //   await update('order')
      //     .given({ payment_status: 'failed' })
      //     .where('order_id', '=', order.order_id)
      //     .execute(connection);
      //
      //   // Add an activity log
      //   await insert('order_activity')
      //     .given({
      //       order_activity_order_id: order.order_id,
      //       comment: `Tazapay payment method was expired. PaymentMethodId: ${txnData.id}`
      //     })
      //     .execute(connection);
      //
      //   await emit('payment_status_changed', { ...order });
      //   break;
      // }


      // ... handle other event types
      default:
        debug(`Unhandled event type ${webhookData.type}`);
    }

    await commit(connection);
    // Return a response to acknowledge receipt of the event
    response.status(OK).send('Webhook received');
  } catch (err) {
    await rollback(connection);
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
};
