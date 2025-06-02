module.exports = {
  routes: [
    {
      method: "POST",
      path: "/articles/:id/batch-upload",
      handler: "api::article.article.batchUploadGalleryImages",
      config: {
        auth: {
          scope: ["find", "update"],
        },
        policies: [],
        middlewares: [],
      },
    },
  ],
};
