const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE "order" ADD COLUMN "sub_total_old_price" decimal(12,4)`
  );

  await execute(
    connection,
    `ALTER TABLE "order" ADD COLUMN "sub_total_discount_amount" decimal(12,4)`
  );

  await execute(
    connection,
    `ALTER TABLE "cart" ADD COLUMN "sub_total_old_price" decimal(12,4)`
  );

  await execute(
    connection,
    `ALTER TABLE "cart" ADD COLUMN "sub_total_discount_amount" decimal(12,4)`
  );
};
