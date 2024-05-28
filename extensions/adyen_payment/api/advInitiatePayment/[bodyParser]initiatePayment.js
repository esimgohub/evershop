const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');

// Adyen Node.js API library boilerplate (configuration, etc.)

// let client;
// let checkout;
// async function initializeAdyen() {
//   const config = new Config();
//   config.apiKey = await getSetting('adyenApiKey', '');
//   client = new Client({ config });
//   client.setEnvironment("TEST");  // change to LIVE for production
//   checkout = new CheckoutAPI(client);
// }

// // Immediately invoke the function to initialize Adyen client
// initializeAdyen().catch(err => {
//   console.error("Failed to initialize Adyen:", err);
// });

const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

module.exports = async (request, response, delegate, next) => {
  // unique ref for the transaction
  const { order_id: orderRef } = request.body;
  try {
    // Allows for gitpod support
    const merchantAccount = await getSetting("adyenMerchantAccount", '');
    // ideally the data passed here should be computed based on business logic
    const data = await checkout.PaymentsApi.payments({
      amount: { currency: "USD", value: 1000 },
      reference: orderRef, // required
      merchantAccount: merchantAccount, // required
      channel: "iOS", // required
      paymentMethod: request.body.paymentMethod,
      lineItems: [
        { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
        { quantity: 1, amountIncludingTax: 5000, description: "Headphones" }
      ],
    });

    response.json(data);
  } catch (err) {
    next(err);
  }
};