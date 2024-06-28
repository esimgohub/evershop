const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  // Create a reset_password_token table
  await execute(
    connection,
    `
    CREATE TABLE deep_link (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code varchar(255) NOT NULL,
      web_url varchar(255) DEFAULT NULL,
      app_url varchar(255) DEFAULT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE deep_link_param (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      deep_link_id uuid NOT NULL,
      param_code varchar(255) NOT NULL,
      param_value varchar(255) NOT NULL,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),

      CONSTRAINT DEEP_LINK_PARAM_UNIQUE UNIQUE (param_code),

      CONSTRAINT FK_DEEP_LINK
        FOREIGN KEY (deep_link_id) REFERENCES deep_link (id)
        ON DELETE SET NULL
    );
    `
  );
};
