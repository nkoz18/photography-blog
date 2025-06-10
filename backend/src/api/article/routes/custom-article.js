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
    {
      method: "GET",
      path: "/articles/by-token/:slug/:token",
      handler: "api::article.article.findByToken",
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};
