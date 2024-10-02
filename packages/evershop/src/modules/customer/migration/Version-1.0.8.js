const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN IF NOT EXISTS referral_code varchar DEFAULT NULL;
    `
  );

  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN IF NOT EXISTS referred_code varchar DEFAULT NULL;
    `
  );
};
