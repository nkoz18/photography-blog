module.exports = {
  routes: [
    {
      method: "POST",
      path: "/articles/:id/batch-upload",
      handler: "api::article.article.batchUploadGalleryImages",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
