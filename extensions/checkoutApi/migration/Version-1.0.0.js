const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Add a column named `is_active` to `cart_item` table
  await execute(
    connection,
    `ALTER TABLE "cart_item" ADD COLUMN "is_active" boolean NOT NULL DEFAULT TRUE`
  );
};
