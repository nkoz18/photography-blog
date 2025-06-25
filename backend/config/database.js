const path = require('path');

module.exports = ({ env }) => {
  // Always use PostgreSQL to match production (no more SQLite in development)
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'localpass'),
        schema: env('DATABASE_SCHEMA', 'public'),
        ssl: env('NODE_ENV') === 'production' ? {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        } : false,
      },
      debug: false,
      useNullAsDefault: true,
      acquireConnectionTimeout: 1000000,
    },
  };
};