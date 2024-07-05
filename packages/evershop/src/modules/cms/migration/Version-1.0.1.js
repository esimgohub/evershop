const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `ALTER TABLE "cms_page"
    ADD COLUMN "index" INT DEFAULT 0;`
  );

  await execute(
    connection,
    `ALTER TABLE "cms_page_description"
    ADD COLUMN "short_description" VARCHAR(100) DEFAULT NULL;`
  );

  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "related_cms_page" (
    "cms_page_id" INT NOT NULL,
    "parent_id" INT NOT NULL,
    "index" INT DEFAULT NULL,

    CONSTRAINT "PK_RELATED_CMS_PAGE_ID" PRIMARY KEY ("cms_page_id", "parent_id"),
    CONSTRAINT "FK_CMS_PAGE_ID" FOREIGN KEY ("cms_page_id") REFERENCES "cms_page" ("cms_page_id") ON DELETE CASCADE,
    CONSTRAINT "FK_PARENT_ID" FOREIGN KEY ("parent_id") REFERENCES "cms_page" ("cms_page_id") ON DELETE CASCADE
    );`
  );
};
