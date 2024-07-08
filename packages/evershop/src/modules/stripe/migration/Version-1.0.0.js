const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // save last 4 digits + payment intent key for re-try payment
  await execute(
    connection,
    `ALTER TABLE "order" ADD COLUMN "stripe_client_sec_key" text`
  );

  await execute(
    connection,
    `ALTER TABLE "order" ADD COLUMN "stripe_payment_method_id" text`
  );

  await execute(
    connection,
    `ALTER TABLE "payment_transaction" ADD COLUMN "stripe_client_sec_key" text`
  );

  await execute(
    connection,
    `ALTER TABLE "payment_transaction" ADD COLUMN "stripe_payment_method_id" text`
  );
};
