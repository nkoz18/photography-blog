const path = require('path');

module.exports = ({ env }) => {
  // Use SQLite for local development, PostgreSQL for production
  if (env('NODE_ENV') === 'development') {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: path.join(__dirname, '..', '.tmp', 'data.db'),
        },
        useNullAsDefault: true,
      },
    };
  }
  
  // Production database settings
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST'),
        port: env.int('DATABASE_PORT'),
        database: env('DATABASE_NAME'),
        user: env('DATABASE_USERNAME'),
        password: env('DATABASE_PASSWORD'),
        schema: env('DATABASE_SCHEMA', 'public'),
        ssl: {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
        },
      },
      debug: true,
      useNullAsDefault: true,
      acquireConnectionTimeout: 1000000,
    },
  };
};