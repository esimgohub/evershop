const { execute } = require('@evershop/postgres-query-builder');

module.exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE category ADD COLUMN category_type varchar(255) DEFAULT NULL;`
  );
};