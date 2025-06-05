module.exports = [
  {
    method: 'POST',
    path: '/batch-upload-gallery/:id',
    handler: 'gallery.batchUploadGallery',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
      ],
    },
  },
];