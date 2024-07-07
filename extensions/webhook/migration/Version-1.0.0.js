const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Create a reset_password_token table
  await execute(
    connection,
    `
    CREATE TYPE FULFILLMENT_STATUS_ENUM AS ENUM (
        'None',
        'Pending',
        'Processing',
        'Completed',
        'Failed',
        'Canceled'
    );

    ALTER TABLE "order" ADD COLUMN "fulfillment_status" FULFILLMENT_STATUS_ENUM DEFAULT 'None';
    ALTER TABLE "order" ADD COLUMN "reference_order_number" varchar(255) DEFAULT NULL;
    ALTER TABLE "order_item" ADD COLUMN "serial" jsonb DEFAULT NULL;
    `
  );
};
