const { execute, insert } = require('@evershop/postgres-query-builder');

module.exports = async (connection) => {
  await execute(
    connection,
    `CREATE TABLE product_category (
      product_id UUID NOT NULL,
      category_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (product_id, category_id),
      FOREIGN KEY (product_id) REFERENCES product (uuid),
      FOREIGN KEY (category_id) REFERENCES category (uuid)
    )`
  );
};