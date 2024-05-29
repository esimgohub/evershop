const { execute, insert } = require('@evershop/postgres-query-builder');

module.exports = async (connection) => {
  await execute(
    connection,
    `CREATE TABLE product_category (
      product_id INT NOT NULL,
      category_id INT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (product_id, category_id),
      FOREIGN KEY (product_id) REFERENCES product (product_id),
      FOREIGN KEY (category_id) REFERENCES category (category_id)
    )`
  );
};