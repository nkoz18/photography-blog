module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/photo-encounters/coords',
      handler: 'photo-encounter.createFromCoords',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};