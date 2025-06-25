'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::contact.contact', {
  config: {
    create: {
      auth: false,
    },
  },
});