const { execute } = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
  await execute(
    connection,
    `CREATE TABLE post (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        index integer DEFAULT NULL,
        thumbnail text NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        link text NOT NULL,
        is_visible integer DEFAULT NULL
    );`
  );
};
