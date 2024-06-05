const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const { INVALID_PAYLOAD, INTERNAL_SERVER_ERROR } = require('@evershop/evershop/src/lib/util/httpStatus');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const { select } = require('@evershop/postgres-query-builder');

// Adyen configuration
const config = new Config();
config.apiKey = process.env.ADYEN_API_KEY;
const client = new Client({ config });
client.setEnvironment(process.env.ADYEN_ENV);
const checkout = new CheckoutAPI(client);

function convertToMinorUnits(amount, currency) {
  const currencyMinorUnits = {
    USD: 2,
    VND: 0
  };

  const minorUnits = currencyMinorUnits[currency];

  if (minorUnits === undefined) {
    throw new Error(`Unknown currency: ${currency}`);
  }

  return amount * Math.pow(10, minorUnits);
}


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

    const browserInfo = {
      userAgent: request.body?.browserInfo?.userAgent || 'User-Agent header not found',
      acceptHeader: request.body?.browserInfo?.acceptHeader || 'Accept header not found'
    };

    const addtionalParameters = {
      shopperEmail: order.customer_email,
      browserInfo
    };

    const items = await select()
      .from('order_item')
      .where('order_item_order_id', '=', order.order_id)
      .execute(pool);

    const billingAddressSrc = await select()
      .from('order_address')
      .where('order_address_id', '=', order.billing_address_id)
      .load(pool);

    // Add billing address
    if (billingAddressSrc) {
      addtionalParameters.billingAddress = {
        city: billingAddressSrc.city,
        houseNumberOrName: '1',
        postalCode: billingAddressSrc.postcode,
        country: billingAddressSrc?.country?.code ? billingAddressSrc.country.code : 'VN',
        street: billingAddressSrc.address_1
      };
    }

    // Allows for gitpod support
    const merchantAccount = await getSetting('adyenMerchantAccount', '');

    // ideally the data passed here should be computed based on business logic
    const data = await checkout.PaymentsApi.payments({
      ...addtionalParameters,
      merchantAccount, // required
      paymentMethod: request.body.paymentMethod,
      authenticationData: {
        threeDSRequestData: { nativeThreeDS: 'preferred' }
      },
      amount: {
        currency: order.currency,
        value: convertToMinorUnits(order.grand_total, order.currency)
      },
      reference: orderRef, // required
      channel: 'iOS', // required
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
