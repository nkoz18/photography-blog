module.exports = ({ env }) => [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
          "img-src": [
            "'self'",
            "data:",
            "cdn.jsdelivr.net",
            "strapi.io",
            `${env("AWS_BUCKET_NAME")}.s3.${env("AWS_REGION")}.amazonaws.com`,
          ],
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::favicon",
  "strapi::public",
];
// module.exports = ({ env }) => [
//   "strapi::errors",
//   {
//     name: "strapi::security",
//     config: {
//       contentSecurityPolicy: {
//         directives: {
//           "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
//           "img-src": [
//             "'self'",
//             "data:",
//             "cdn.jsdelivr.net",
//             "strapi.io",
//             `${env("AWS_BUCKET_NAME")}.s3.${env("AWS_REGION")}.amazonaws.com`,
//           ],
//         },
//       },
//     },
//   },
//   "strapi::cors",
//   "strapi::poweredBy",
//   "strapi::logger",
//   "strapi::query",
//   "strapi::body",
//   "strapi::favicon",
//   "strapi::public",
// ];


module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
>>>>>>> origin/master
