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
const { getConfig } = require('@evershop/evershop/src/lib/util/getConfig');
const { emit } = require('@evershop/evershop/src/lib/event/emitter');
const { debug } = require('@evershop/evershop/src/lib/log/logger');
const { display } = require('zero-decimal-currencies');
const { getSetting } = require('../../../setting/services/setting');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  const sig = request.headers['stripe-signature'];

  let event;
  const connection = await getConnection();
  try {
    const stripeConfig = getConfig('system.stripe', {});
    let stripeSecretKey;
    if (stripeConfig.secretKey) {
      stripeSecretKey = stripeConfig.secretKey;
    } else {
      stripeSecretKey = await getSetting('stripeSecretKey', '');
    }
    const stripe = require('stripe')(stripeSecretKey);

    // Webhook enpoint secret
    let endpointSecret;
    if (stripeConfig.endpointSecret) {
      endpointSecret = stripeConfig.endpointSecret;
    } else {
      endpointSecret = await getSetting('stripeEndpointSecret', '');
    }

    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    await startTransaction(connection);
    // Handle the event
    // payment_intent.canceled
    // payment_intent.payment_failed
    // payment_intent.processing
    // payment_intent.succeeded
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        // eslint-disable-next-line no-case-declarations
        const { orderId } = paymentIntent.metadata;
        // Load the order
        const order = await select()
          .from('order')
          .where('uuid', '=', orderId)
          .load(connection);

        // Update the order
        // Create payment transaction
        await insert('payment_transaction')
          .given({
            amount: parseFloat(
              display(paymentIntent.amount, paymentIntent.currency)
            ),
            payment_transaction_order_id: order.order_id,
            transaction_id: paymentIntent.id,
            transaction_type: 'online',
            payment_action:
              paymentIntent.capture_method === 'automatic'
                ? 'Capture'
                : 'Authorize'
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
            comment: `Customer paid by using credit card. Stripe payment method ID: ${paymentIntent.id}`
          })
          .execute(connection);

        // Emit event to add order placed event
        await emit('order_placed', { ...order });
        break;
      }
      case 'payment_intent.payment_failed': {
        debug('PaymentMethod was failed!');
        const paymentIntent = event.data.object;
        // eslint-disable-next-line no-case-declarations
        const { orderId } = paymentIntent.metadata;
        // Load the order
        const order = await select()
          .from('order')
          .where('uuid', '=', orderId)
          .load(connection);
        // Update the order status
        await update('order')
          .given({ payment_status: 'failed' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `PaymentMethod was failed. Stripe payment method ID: ${paymentIntent.id}`
          })
          .execute(connection);
        break;
      }

      case 'payment_method.canceled': {
        debug('PaymentMethod was canceled!');
        const paymentIntent = event.data.object;
        // eslint-disable-next-line no-case-declarations
        const { orderId } = paymentIntent.metadata;
        // Load the order
        const order = await select()
          .from('order')
          .where('uuid', '=', orderId)
          .load(connection);
        // Update the order status
        await update('order')
          .given({ payment_status: 'canceled' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `PaymentMethod was canceled. Stripe payment method ID: ${paymentIntent.id}`
          })
          .execute(connection);
        break;
      }

      case 'payment_method.processing': {
        debug('PaymentMethod is processing!');
        const paymentIntent = event.data.object;
        // eslint-disable-next-line no-case-declarations
        const { orderId } = paymentIntent.metadata;
        // Load the order
        const order = await select()
          .from('order')
          .where('uuid', '=', orderId)
          .load(connection);
        // Update the order status
        await update('order')
          .given({ payment_status: 'pending' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `PaymentMethod is processing. Stripe payment method ID: ${paymentIntent.id}`
          })
          .execute(connection);

        break;
      }

      // ... handle other event types
      default:
        debug(`Unhandled event type ${event.type}`);

    }
    await commit(connection);
    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  } catch (err) {
    await rollback(connection);
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
};
