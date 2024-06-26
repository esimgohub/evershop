const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Create a reset_password_token table
  await execute(
    connection,
    `ALTER TABLE customer
    DROP COLUMN full_name;`
  );

  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN first_name VARCHAR(50),
    ADD COLUMN last_name VARCHAR(50),
    ADD COLUMN avatar_url TEXT`
  );
};
