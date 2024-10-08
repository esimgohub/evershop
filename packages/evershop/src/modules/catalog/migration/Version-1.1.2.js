const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Add banner_image column to category_description
  await execute(
    connection,
    `ALTER TABLE category_description ADD COLUMN "banner_image" varchar DEFAULT NULL;`
  );
};
