const { uuid } = require('uuidv4');
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

// Immediately invoke the function to initialize Adyen client
initializeAdyen().catch(err => {
  console.error("Failed to initialize Adyen:", err);
});

module.exports = async (request, response, delegate, next) => {
  const { order_id } = request.body;
      try {
        // unique ref for the transaction
        const orderRef = uuid();
        // Allows for gitpod support
        const localhost = request.get('host');
        // const isHttps = req.connection.encrypted;
        const protocol = request.socket.encrypted? 'https' : 'http';
        // Ideally the data passed here should be computed based on business logic
        const merchantAccount = await getSetting("adyenMerchantAccount", '')
        const data = await checkout.PaymentsApi.sessions({
          amount: { currency: "USD", value: 1000 }, // value is 100$ in minor units
          countryCode: "us",
          merchantAccount: merchantAccount, // required
          reference: orderRef, // required: your Payment Reference
          returnUrl: `${protocol}://${localhost}/checkout?orderRef=${orderRef}`, // set redirect URL required for some payment methods (ie iDEAL)
          // set lineItems required for some payment methods (ie Klarna)
          lineItems: [
            {quantity: 1, amountIncludingTax: 5000 , description: "Sunglasses"},
            {quantity: 1, amountIncludingTax: 5000 , description: "Headphones"}
          ] 
        });
    
        response.json(data);
      } catch (err) {
        // console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
        // res.status(err.statusCode).json(err.message);
        next(err);
      }
}