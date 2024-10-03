const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { sendFulfillEsim } = require('../../services/esim.service')
module.exports = async function (data) {
  try {
    await sendFulfillEsim(data.orderUUID);
  } catch (e) {
    error(`Initial attempt failed by refOrderCode: ${data.orderUUID} \n ${ e.message}`);
    retryFulfillEsim(data.orderUUID, 1);
  }
};

async function markCompleted(orderUUID) {
  info(`Retry successful - Esim fulfilment request by refOrderCode: ${orderUUID}`);
}

// Retry function
function retryFulfillEsim(orderUUID, retriesLeft) {
  setTimeout(async () => {
    try {
      await sendFulfillEsim(orderUUID);
      await markCompleted(orderUUID);
    } catch (e) {
      error(`Retry failed: ${e.message}`);
      if (retriesLeft > 0) {
        const nextRetriesLeft = retriesLeft - 1;
        info(`Retries left: ${nextRetriesLeft}. Scheduling another retry.`);
        retryFulfillEsim(orderUUID, nextRetriesLeft);
      } else {
        error(`Max retries reached. Giving up on refOrderCode: ${orderUUID}`);
      }
    }
  }, 10 * 60 * 1000); // 10 minutes delay
}

