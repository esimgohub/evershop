const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Create a reset_password_token table
  await execute(
    connection,
    `ALTER TYPE login_source_enum
    ADD VALUE 'magic_link';`
  );
};
