const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { INVALID_PAYLOAD, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const { toPrice } = require('@evershop/evershop/src/modules/checkout/services/toPrice');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { select } = require('packages/postgres-query-builder');

// Adyen configuration
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment('TEST');
const checkout = new CheckoutAPI(client);

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  // unique ref for the transaction
  const { order_uuid: orderRef } = request.body;

  try {
    const order = await select()
      .from('order')
      .where('uuid', '=', orderRef)
      .and('payment_method', '=', 'adyen')
      .and('payment_status', '=', 'pending')
      .load(pool);

    if (!order) {
      response.status(INVALID_PAYLOAD).json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Invalid order'
        }
      });
      return;
    }

    const items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', order.order_id)
      .execute(pool);

    // Allows for gitpod support
    const merchantAccount = await getSetting('adyenMerchantAccount', '');
    // ideally the data passed here should be computed based on business logic
    const data = await checkout.PaymentsApi.payments({
      amount: {
        currency_code: order.currency,
        value: toPrice(order.grand_total)
      },
      reference: orderRef, // required
      merchantAccount, // required
      channel: 'iOS', // required
      paymentMethod: request.body.paymentMethod,
      lineItems: items.map((item) => ({
        sku: item.product_sku,
        quantity: item.qty
      }))
    });

    response.json(data);
  } catch (err) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        message: err.message,
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};
