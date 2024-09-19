const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `CREATE TABLE IF NOT EXISTS "customer_coupon_use" (
    "customer_coupon_use_id" INT GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
    "customer_id" INT NOT NULL,
    "coupon" varchar NOT NULL,
    "used_time" INT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CUSTOMER_COUPON_UNIQUE" UNIQUE ("customer_id", "coupon"),
    CONSTRAINT "CUSTOMER_COUPON_USE_CUSTOMER_FK" FOREIGN KEY ("customer_id") REFERENCES "customer" ("customer_id") ON DELETE CASCADE,
    CONSTRAINT "CUSTOMER_COUPON_USE_COUPON_FK" FOREIGN KEY ("coupon") REFERENCES "coupon" ("coupon") ON DELETE CASCADE
  ) `
  );
};
