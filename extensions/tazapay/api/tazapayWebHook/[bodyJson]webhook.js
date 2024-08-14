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

    await startTransaction(connection);
    // Handle the event
    // todo: handle other event types: payment_attempt.failed, payment_attempt.succeeded, payment_method.processing
    switch (webhookData.type) {
      case 'payment_attempt.succeeded':
      case 'checkout.paid': {
        const { amount, invoice_currency, charge_currency, id, payin } = txnData;
        let txnId = webhookData.type === 'checkout.paid' ? id : payin;
        let txnCurrency = webhookData.type === 'checkout.paid' ? invoice_currency : charge_currency;

        // Update the order
        // Create payment transaction
        await insert('payment_transaction')
          .given({
            amount: parseFloat(
              display(amount, txnCurrency)
            ),
            payment_transaction_order_id: order.order_id,
            transaction_id: txnId,
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
            comment: `Customer paid by using credit card. Tazapay PaymentMethodId: ${txnId}`
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

      case 'checkout.expired': {
        debug(`Tazapay - Payment txn was expired with PaymentMethodId: ${txnData.id}`);
        // Update the order status
        await update('order')
          .given({ payment_status: 'failed' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Tazapay payment method was expired. PaymentMethodId: ${txnData.id}`
          })
          .execute(connection);

        await emit('payment_status_changed', { ...order });
        break;
      }


      // ... handle other event types
      default:
        debug(`Unhandled event type ${webhookData.type}`);
    }

    await commit(connection);
    // Return a response to acknowledge receipt of the event
    response.status(OK);
    response.json({});
  } catch (err) {
    await rollback(connection);
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
};
