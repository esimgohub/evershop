const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE currency
    RENAME COLUMN currency TO code;`
  );

  await execute(
    connection,
    `ALTER TABLE currency
    ADD COLUMN is_default int DEFAULT 0, ADD COLUMN name TEXT;`
  );
};
