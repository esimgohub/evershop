const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');

// Adyen Node.js API library boilerplate (configuration, etc.)
let client;
let checkout;
async function initializeAdyen() {
  const config = new Config();
  config.apiKey = await getSetting('adyenApiKey', '');
  client = new Client({ config });
  client.setEnvironment("TEST");  // change to LIVE for production
  checkout = new CheckoutAPI(client);
}

// // Immediately invoke the function to initialize Adyen client
initializeAdyen().catch(err => {
  console.error("Failed to initialize Adyen:", err);
});

module.exports = async (request, response, delegate, next) => {
  try {
    const merchantAccount = await getSetting("adyenMerchantAccount", '');

    const data = await checkout.PaymentsApi.paymentMethods({
      channel: "Web",
      merchantAccount
    });

    response.json(data);
  } catch (err) {
    next(err);
  }
};