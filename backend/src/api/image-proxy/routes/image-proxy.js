module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/image-proxy/:path*',
      handler: 'image-proxy.proxy',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};