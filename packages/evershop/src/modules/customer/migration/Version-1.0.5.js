const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // roll back the 1.0.4 migration
  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN full_name VARCHAR(50);
`
  );
};