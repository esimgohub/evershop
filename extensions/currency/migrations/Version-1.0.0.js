const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(connection, `CREATE TABLE product_comment (
  id int(10) NOT NULL AUTO_INCREMENT,
  currency varchar(255) NOT NULL,
  rate float NOT NULL,
  signature varchar(255) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
`);
};