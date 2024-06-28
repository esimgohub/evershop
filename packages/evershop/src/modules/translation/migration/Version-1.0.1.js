const { execute } = require('@evershop/postgres-query-builder');

module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE customer RENAME COLUMN language_code TO language_id;`
  );

  await execute(
    connection,
    `ALTER TABLE customer DROP CONSTRAINT FK_CUSTOMER_LANGUAGE;`
  );

  await execute(
    connection,
    `ALTER TABLE customer
     ADD CONSTRAINT FK_CUSTOMER_LANGUAGE FOREIGN KEY (language_id) REFERENCES language(id) ON DELETE SET NULL;`
  );
};
