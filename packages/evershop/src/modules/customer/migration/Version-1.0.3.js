const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Create a reset_password_token table
  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN external_id varchar DEFAULT NULL;`
  );

  await execute(
    connection,
    `CREATE TYPE login_source_enum AS ENUM ('unknown');`
  );

  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN login_source login_source_enum NOT NULL DEFAULT 'unknown';`
  );

  await execute(
    connection,
    `ALTER TABLE customer
  DROP CONSTRAINT "EMAIL_UNIQUE";`
  );

  await execute(
    connection,
    `ALTER TABLE customer
    ALTER COLUMN "email" DROP NOT NULL;`
  );

  await execute(
    connection,
    `ALTER TABLE customer
  ADD CONSTRAINT "EMAIL_EXTERNALID_UNIQUE" UNIQUE ("email", "external_id");`
  );
};
