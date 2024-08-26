const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { sendFulfillOrder } = require('../../services/order.service');

module.exports = async function (orderId) {
  try {
    await sendFulfillOrder(orderId);
  } catch (e) {
    error(`Initial attempt failed - orderId: ${ e.message}`);
    retrySendEmail(orderId, 2);
  }
};

async function markPaymentAsNotified(orderId) {
  info(`Retry successful - Order fulfilment request - orderId: ${orderId}`);
}

// Retry function
function retrySendEmail(orderId, retriesLeft) {
  setTimeout(async () => {
    try {
      await sendFulfillOrder(orderId);
      await markPaymentAsNotified(orderId);
    } catch (e) {
      error(`Retry failed: ${e.message}`);
      if (retriesLeft > 0) {
        const nextRetriesLeft = retriesLeft - 1;
        info(`Retries left: ${nextRetriesLeft}. Scheduling another retry.`);
        retrySendEmail(orderId, nextRetriesLeft);
      } else {
        error(`Max retries reached. Giving up on orderId: ${orderId}`);
      }
    }
  }, 10 * 60 * 1000); // 10 minutes delay
}

