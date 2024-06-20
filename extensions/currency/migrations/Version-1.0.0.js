const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(connection, `CREATE TABLE currency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency varchar(255) NOT NULL,
  rate float NOT NULL,
  signature varchar(255),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
`);
};