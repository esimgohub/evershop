const { execute } = require('@evershop/postgres-query-builder');

module.exports = async (connection) => {
  await execute(
    connection,
    `
      ALTER TABLE product DROP CONSTRAINT "UNSIGNED_PRICE";
      ALTER TABLE product ALTER COLUMN price SET DEFAULT NULL;
      ALTER TABLE product ALTER COLUMN "price" DROP NOT NULL
    `
  );
};

