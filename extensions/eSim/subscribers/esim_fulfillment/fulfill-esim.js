const { error, info } = require('@evershop/evershop/src/lib/log/logger');
// todo: manual api call to fulfilment data if error in webhook->avoid workload on GC
module.exports = async function (data) {
  try {
    // await sendFulfillOrder(data.orderId);
  } catch (e) {
    error(`Initial attempt failed - orderId: ${ e.message}`);
    // retrySendEmail(data.orderId, 2);
  }
};

async function markPaymentAsNotified(orderId) {
  info(`Retry successful - Order fulfilment request - orderId: ${orderId}`);
}

