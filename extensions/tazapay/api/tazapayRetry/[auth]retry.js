/* eslint-disable camelcase */
// eslint-disable-next-line max-classes-per-file
const { select, insert } = require('@evershop/postgres-query-builder');
const { pool } = require('@evershop/evershop/src/lib/postgres/connection');
const {
  INVALID_PAYLOAD,
  INTERNAL_SERVER_ERROR,
  OK
} = require('@evershop/evershop/src/lib/util/httpStatus');
const { getSetting } = require('@evershop/evershop/src/modules/setting/services/setting');
const smallestUnit = require('zero-decimal-currencies');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const { makeRequest } = require('../../services/signature_generation');
const { calculateExpiry } = require('../../services/utils');
const geoip = require('geoip-lite');
const { getOrdersBaseQuery } = require('@evershop/evershop/src/modules/oms/services/getOrdersBaseQuery');

const convertFromUSD = (amount, rate, currentIsoCode) => {
  if (currentIsoCode === 'USD') {
    return amount;
  }
  return amount * rate;
};

const generateTxnDescription = (items) => {
  const itemsDescription = items.map((item) => `${item.qty} x ${item.product_sku}\n`);
  return itemsDescription.join('');
};

const parseIp = (req) =>
  req.headers['x-forwarded-for']?.split(',').shift()
  || req.socket?.remoteAddress;

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response, delegate, next) => {
  try {
    let customerCountry = null;
    const ip = parseIp(request);
    if (ip) {
      const geo = geoip.lookup(ip);
      if (geo) {
        customerCountry = geo.country;
      }
    }

    info('IP====', ip);
    info('customerCountry====', customerCountry);

    const { order_uuid } = request.body;
    const idempotencyKey = request.locals.sessionID;

    let order = null;
    const query = getOrdersBaseQuery();
    query.where('uuid', '=', order_uuid);
    order = await query.load(pool);

    if (!order || order?.payment_status === 'paid') {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          message: order?.payment_status === 'paid' ? 'Order already paid' : 'Invalid order',
          status: INVALID_PAYLOAD
        }
      });
      return;
    }

    const paymentIntent = await createPaymentIntent(idempotencyKey, order, customerCountry, pool);

    response.status(OK);
    response.$body = {
      data: { ...paymentIntent }
    };
    next();
  } catch (e) {
    error(e.message);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        message: e.message,
        status: INTERNAL_SERVER_ERROR
      }
    });
  }
};

const createPaymentIntent = async (idempotencyKey, order, customerCountry, pool) => {
    try {
      const foundCurrency = await select()
        .from('currency')
        .where('code', '=', order.currency)
        .load(pool);

      if (!foundCurrency) {
        throw new Error(`Not found currency with code: ${order.currency}`);
      }

      const formatedGrandTotal = convertFromUSD(parseFloat(order.grand_total), foundCurrency.rate, order.currency);

      const items = await select()
        .from('order_item')
        .where('order_item_order_id', '=', order.order_id)
        .execute(pool);
      // Create a PaymentIntent with the order amount and currency
      const successUrl = await getSetting('tazapaySuccessUrl', '');
      const cancelUrl = await getSetting('tazapayCancelUrl', '');

      const body = {
        reference_id: order.order_number,
        success_url: `${successUrl}?uuid=${order.uuid}`,
        cancel_url: `${cancelUrl}?uuid=${order.uuid}`,
        invoice_currency: order.currency,
        amount: smallestUnit.default(formatedGrandTotal, order.currency),
        customer_details: {
          name: order.customer_full_name,
          // todo: use real email of customer
          email: order.customer_email ?? await getSetting('storeEmail', 'booking@gohub.vn'),
          // todo: refactor later, this is just for test
          country: customerCountry ?? 'VN'
        },
        transaction_description: generateTxnDescription(items),
        payment_methods: ['card'],
        expires_at: calculateExpiry(15)
      };
      const txn = await makeRequest(idempotencyKey, 'POST', '/v3/checkout', body);

      if (!txn) {
        throw new PaymentIntentCreationError(`Tazapay - Payment transaction create failed`, {
          order
        });
      }

      return txn;

    } catch (e) {
      throw new PaymentIntentCreationError(`Tazapay - Payment transaction create failed: ${e}`, {
        order
      });
    }
  }
;