const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE customer
     DROP CONSTRAINT "EMAIL_EXTERNALID_UNIQUE";
    `
  );

  await execute(
    connection,
    `ALTER TABLE customer
     ADD CONSTRAINT "CUSTOMER_EXTERNAL_ID_LOGIN_SOURCE_UNIQUE" UNIQUE ("login_source", "external_id");`
  );

  // Allow null email since Facebook account doesn't have email
  await execute(
    connection,
    `ALTER TABLE customer
     ADD CONSTRAINT "CUSTOMER_EMAIL_UNIQUE" UNIQUE ("email");`
  );
};
