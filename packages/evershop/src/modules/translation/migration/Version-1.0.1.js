const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE customer DROP COLUMN IF EXISTS language_code;`
  );

  // await execute(
  //   connection,
  //   `ALTER TABLE customer DROP CONSTRAINT IF EXISTS FK_CUSTOMER_LANGUAGE;`
  // );

  await execute(
    connection,
    `ALTER TABLE customer ADD COLUMN language_id uuid, ADD CONSTRAINT FK_CUSTOMER_LANGUAGE FOREIGN KEY (language_id) REFERENCES language(id) ON DELETE SET NULL;`
  );
};
