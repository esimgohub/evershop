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
  // const shopperIP = request.headers["x-forwarded-for"] || request.connection.remoteAddress;
  try {
    // Allows for gitpod support
    const localhost = request.get('host');
    // const isHttps = request.connection.encrypted;
    // const protocol = request.socket.encrypted ? 'https' : 'http';
    // Ideally the data passed here should be computed based on business logic
    const merchantAccount = await getSetting("adyenMerchantAccount", '');
    // ideally the data passed here should be computed based on business logic
    const data = await checkout.PaymentsApi.payments({
      amount: { currency: "USD", value: 1000 }, // value is 10€ in minor units
      reference: orderRef, // required
      merchantAccount: merchantAccount, // required
      channel: "Web", // required
      paymentMethod: request.body.paymentMethod, 
      // origin: `${protocol}://${localhost}`, // required for 3ds2 native flow
      // shopperIP, // required by some issuers for 3ds2
      // socialSecurityNumber: '12398540',

      // returnUrl: `${protocol}://${localhost}/api/handleShopperRedirect?orderRef=${orderRef}`, // required for 3ds2 redirect flow
      // special handling for boleto
      // we strongly recommend that you the billingAddress in your request. 
      // card schemes require this for channel web, iOS, and Android implementations.
      // below fields are required for Klarna, line items included
      // shopperReference: "12345",
      // shopperEmail: "youremail@email.com",
      lineItems: [
        { quantity: 1, amountIncludingTax: 5000, description: "Sunglasses" },
        { quantity: 1, amountIncludingTax: 5000, description: "Headphones" }
      ],
    });

    response.json(data);
  } catch (err) {
    // console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
    // res.status(err.statusCode).json(err.message);
    next(err);
  }
};