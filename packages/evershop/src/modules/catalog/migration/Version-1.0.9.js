const { execute } = require('@evershop/postgres-query-builder');

module.exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE product ADD COLUMN old_price FLOAT DEFAULT NULL;
     ALTER TABLE product ADD COLUMN parent_product_id INT DEFAULT NULL;
     ALTER TABLE product ADD COLUMN parent_product_uuid UUID DEFAULT NULL;
    `
  );
};