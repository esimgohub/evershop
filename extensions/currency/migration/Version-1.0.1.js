const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE customer
    ADD COLUMN IF NOT EXISTS currency_id uuid,
    ADD CONSTRAINT FK_CUSTOMER_CURRENCY 
    FOREIGN KEY (currency_id) REFERENCES currency (id) ON DELETE SET NULL;`
  );
};
