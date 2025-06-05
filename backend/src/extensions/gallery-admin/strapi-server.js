'use strict';

module.exports = (plugin) => {
  // Add custom admin routes
  plugin.routes['admin'].routes.push({
    method: 'POST',
    path: '/batch-upload-gallery/:id',
    handler: 'gallery.batchUploadGallery',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  });

  // Add custom controller
  plugin.controllers.gallery = require('./server/controllers/gallery');

  return plugin;
};