const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { sendFulfillOrder } = require('../../services/order.service');

module.exports = async function (data) {
  try {
    await sendFulfillOrder(data);
  } catch (e) {
    error(`Initial attempt failed - orderId: ${ e.message}`);
    retrySendEmail(data, 3);
  }
};

async function markPaymentAsNotified(orderId) {
  info(`Retry successful - Order fulfilment request - orderId: ${orderId}`);
}

// Retry function
function retrySendEmail(order, retriesLeft) {
  setTimeout(async () => {
    try {
      await sendFulfillOrder(order);
      await markPaymentAsNotified(order.uuid);
    } catch (e) {
      error(`Retry failed: ${e.message}`);
      if (retriesLeft > 0) {
        const nextRetriesLeft = retriesLeft - 1;
        info(`Retries left: ${nextRetriesLeft}. Scheduling another retry.`);
        retrySendEmail(order, nextRetriesLeft);
      } else {
        error(`Max retries reached. Giving up on orderId: ${order.uuid}`);
      }
    }
  }, 10 * 1000); // 10 minutes delay
}

