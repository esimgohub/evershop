/* eslint-disable global-require */
const { hmacValidator: HmacValidator } = require('@adyen/api-library');
const createCoupon = require('@evershop/evershop/src/modules/promotion/services/coupon/createCoupon');
const {
  CouponBuilder,
  generateReferralCode
} = require('@evershop/evershop/src/modules/promotion/services/coupon/coupon.service');
const { error, info } = require('@evershop/evershop/src/lib/log/logger');
const {
  insert,
  startTransaction,
  update,
  commit,
  rollback,
  select
} = require('@evershop/postgres-query-builder');
const {
  getConnection
} = require('@evershop/evershop/src/lib/postgres/connection');
const { emit } = require('@evershop/evershop/src/lib/event/emitter');
const { debug } = require('@evershop/evershop/src/lib/log/logger');
const { display } = require('zero-decimal-currencies');
const {
  getSetting
} = require('@evershop/evershop/src/modules/setting/services/setting');
const { OK } = require('@evershop/evershop/src/lib/util/httpStatus');

// eslint-disable-next-line no-unused-vars
module.exports = async (request, response) => {
  const connection = await getConnection();
  try {
    await startTransaction(connection);
    const payloadBuffer = request.body;
    const payloadString = payloadBuffer.toString('utf8'); // 'utf8' is the encoding
    const webhookData = JSON.parse(payloadString);

    const validator = new HmacValidator();
    // get notificationItems from body
    const notificationRequestItems = webhookData.notificationItems;

    // fetch first (and only) NotificationRequestItem
    const notificationRequestItem =
      notificationRequestItems[0].NotificationRequestItem;
    info(notificationRequestItem);

    const hmacKey = await getSetting('adyenHmacKey', '');

    if (!validator.validateHMAC(notificationRequestItem, hmacKey)) {
      // invalid hmac: webhook cannot be accepted
      response.status(401).send('Invalid HMAC signature');
      return;
    }

    const txnData = notificationRequestItem;
    // eslint-disable-next-line no-case-declarations
    // Load the order
    if (!txnData) {
      error('Adyen - Transaction data is empty');
      throw new Error('Adyen - Transaction data is empty');
    }

    const order = await select()
      .from('order')
      .where('order_number', '=', txnData?.merchantReference)
      .load(connection);

    if (!order) {
      error(`Adyen - Order not found with order uuid: ${txnData.reference_id}`);
      throw new Error(
        `Adyen - Order not found with order uuid: ${txnData.reference_id}`
      );
    }

    switch (txnData?.eventCode) {
      case 'AUTHORISATION': {
        if (order.payment_status === 'paid') {
          break;
        }
        let payment_details = null;
        if (txnData?.success === 'true') {
          const brand = txnData?.paymentMethod;
          const [_, last4, expiryDate] = txnData?.reason.split(':');
          const [expMonth, expYear] = expiryDate.split('/');
          payment_details = JSON.stringify({
            type: txnData?.paymentMethod,
            details: {
              brand,
              last4,
              expMonth,
              expYear
            }
          });

          await insert('payment_transaction')
            .given({
              amount: parseFloat(
                display(txnData?.amount?.value, txnData?.amount?.currency)
              ),
              payment_transaction_order_id: order.order_id,
              transaction_id: txnData?.pspReference,
              transaction_type: 'online',
              payment_action: 'Capture'
            })
            .execute(connection);

          // Update the order status
          await update('order')
            .given({
              payment_status: 'paid',
              payment_details
            })
            .where('order_id', '=', order.order_id)
            .execute(connection);

          const referralCode = await generateReferralCode(
            order?.customer_email?.split('@')[0]?.slice(0, 5),
            connection
          );

          const couponBuilder = new CouponBuilder();
          const couponRequest = couponBuilder
            .setCoupon(referralCode)
            .setDiscount(30, 'percentage')
            .setMaxUsesPerCoupon(0)
            .setMaxUsesPerCustomer(1)
            .setCondition('', '', true)
            .setDescription(
              `Reward coupon code for ${order.customer_full_name}`
            )
            .build();

          const coupon = await createCoupon(couponRequest, {});
          if (coupon.coupon) {
            await insert('customer_coupon_use')
              .given({
                customer_id: order.customer_id,
                coupon: coupon.coupon,
                used_time: 0
              })
              .execute(connection);
          }

          // Add an activity log
          await insert('order_activity')
            .given({
              order_activity_order_id: order.order_id,
              comment: `Customer paid by using Adyen - pspReference: ${txnData.pspReference}`
            })
            .execute(connection);

          // Emit event to add order placed event
          await emit('payment_status_changed', { orderId: order.order_id });
        } else {
          // Update the order status
          await update('order')
            .given({
              payment_status: 'failed',
              payment_details
            })
            .where('order_id', '=', order.order_id)
            .execute(connection);
        }

        break;
      }

      case 'CAPTURE_FAILED': {
        debug(
          `Adyen - Payment txn was failed with pspReference: ${txnData.pspReference}`
        );
        // Update the order status
        await update('order')
          .given({ payment_status: 'failed' })
          .where('order_id', '=', order.order_id)
          .execute(connection);

        // Add an activity log
        await insert('order_activity')
          .given({
            order_activity_order_id: order.order_id,
            comment: `Adyen payment method was failed. pspReference: ${txnData.pspReference}`
          })
          .execute(connection);

        break;
      }

      // ... handle other event types
      default:
        debug(`Unhandled event type ${txnData.eventCode}`);
    }

    await commit(connection);
    // Return a response to acknowledge receipt of the event
    response.status(OK);
    response.$body = { received: true };
  } catch (err) {
    await rollback(connection);
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
};
