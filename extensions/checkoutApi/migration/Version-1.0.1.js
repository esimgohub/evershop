const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE "cart_item" ADD COLUMN "category_id" TEXT`
  );

  await execute(
    connection,
    `ALTER TABLE "order_item" ADD COLUMN "category_id" TEXT`
  );

  await execute(
    connection,
    `ALTER TABLE "cart_item" ADD COLUMN "trip" TEXT`
  );

  await execute(
    connection,
    `ALTER TABLE "order_item" ADD COLUMN "trip" TEXT`
  );
};
