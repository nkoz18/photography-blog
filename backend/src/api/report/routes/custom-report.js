'use strict';

/**
 * Custom report routes
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/reports/:id/update-status',
      handler: 'report.updateStatus',
      config: {
        auth: {
          scope: ['admin']
        },
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST', 
      path: '/report-image/:imageId',
      handler: 'report.create',
      config: {
        auth: false, // Public endpoint
        policies: [],
        middlewares: []
      }
    }
  ]
};