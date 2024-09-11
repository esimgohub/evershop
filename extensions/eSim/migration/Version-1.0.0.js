const { execute } = require('@evershop/postgres-query-builder');

module.exports = async (connection) => {
  // Create a table with the columns lpa, id, uuid, and order_item_id
  await execute(
    connection,
    `
      CREATE TABLE IF NOT EXISTS "esim" (
        "id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
        "uuid" UUID NOT NULL DEFAULT gen_random_uuid (),
        "order_item_id" INT NOT NULL,
        "lpa" VARCHAR(255),
        "customer_id" INT DEFAULT NULL
      )
    `
  );
};
