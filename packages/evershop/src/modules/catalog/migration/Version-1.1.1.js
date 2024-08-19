const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Remove the inventory from the product table
  await execute(
    connection,
    `ALTER TABLE category ADD COLUMN "is_popular" boolean NOT NULL DEFAULT FALSE;
     ALTER TABLE category ADD COLUMN "sort_order" INT DEFAULT NULL`
  );
};
