module.exports = ({ env }) => [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'", "https:"],
          "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "cdn.jsdelivr.net",
            "strapi.io",
            `${env("AWS_BUCKET_NAME")}.s3.${env("AWS_REGION")}.amazonaws.com`,
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            `${env("AWS_BUCKET_NAME")}.s3.${env("AWS_REGION")}.amazonaws.com`,
          ],
          "connect-src": ["'self'", "https:", "wss:"],
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      header: "*",
      origin: [
        "https://api.silkytruth.com",
        "https://www.silkytruth.com",
        "https://silkytruth.com", 
        "http://localhost:3000",
        "http://localhost:1337"
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
      headers: [
        "Content-Type",
        "Authorization",
        "Origin",
        "Accept",
        "Cache-Control",
        "X-Requested-With"
      ],
    },
  },
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  {
    name: "strapi::body",
    config: {
      patchKoa: true,
      multipart: true,
      includeUnparsed: true,
      formidable: {
        maxFileSize: 1000 * 1024 * 1024, // 1GB
        maxFieldsSize: 1000 * 1024 * 1024, // 1GB
        maxFields: 1000,
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
