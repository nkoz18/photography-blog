'use strict';

/**
 * Report router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::report.report', {
  config: {
    find: {
      auth: {
        scope: ['admin']
      },
      policies: [],
      middlewares: []
    },
    findOne: {
      auth: {
        scope: ['admin']
      },
      policies: [],
      middlewares: []
    },
    create: {
      auth: false, // Public endpoint for submitting reports
      policies: [],
      middlewares: []
    },
    update: {
      auth: {
        scope: ['admin']
      },
      policies: [],
      middlewares: []
    },
    delete: {
      auth: {
        scope: ['admin']
      },
      policies: [],
      middlewares: []
    }
  }
});