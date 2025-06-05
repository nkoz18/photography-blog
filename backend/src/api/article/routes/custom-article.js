module.exports = {
  routes: [
    {
      method: "POST",
      path: "/articles/:id/batch-upload",
      handler: "api::article.article.batchUploadGalleryImages",
      config: {
        policies: [
          "admin::isAuthenticatedAdmin",
          {
            name: "admin::hasPermissions",
            config: {
              actions: ["plugin::content-manager.explorer.update"],
            },
          },
        ],
        middlewares: [],
      },
    },
  ],
};
