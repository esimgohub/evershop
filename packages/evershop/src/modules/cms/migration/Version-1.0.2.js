const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `CREATE TYPE CMS_TYPE_ENUM AS ENUM ('Post', 'Page', 'Blog');`
  );

  await execute(
    connection,
    `ALTER TABLE "cms_page"
    ADD COLUMN "type" CMS_TYPE_ENUM;`
  );
};
