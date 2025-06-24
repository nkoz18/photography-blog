module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/instagram/exists',
      handler: 'instagram.exists',
      config: { 
        auth: false, 
        policies: [] 
      },
    },
  ],
};