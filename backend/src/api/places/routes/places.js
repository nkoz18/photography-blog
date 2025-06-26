'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/places/autocomplete',
      handler: 'places.autocomplete',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/places/details',
      handler: 'places.details',
      config: { auth: false },
    },
  ],
};