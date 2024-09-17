const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `CREATE TABLE "customer_coupon_use" (
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

  await execute(
    connection,
    `CREATE OR REPLACE FUNCTION set_coupon_used_time()
    RETURNS TRIGGER 
    LANGUAGE PLPGSQL
    AS
    $$
    BEGIN
        -- Update the used_time in the coupon table
        UPDATE "coupon" SET used_time = used_time + 1 WHERE coupon = NEW.coupon;
    
        -- Insert a new record into customer_coupon_use if it does not exist,
        -- or update the record if it already exists
        INSERT INTO "customer_coupon_use" (customer_id, coupon, used_time, updated_at)
        VALUES (NEW.customer_id, NEW.coupon, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (customer_id, coupon)
        DO UPDATE SET 
            used_time = customer_coupon_use.used_time + 1,  -- Increment used_time
            updated_at = CURRENT_TIMESTAMP;  -- Update the timestamp
    
        RETURN NEW;
    END;
    $$;
    `
  );
};
