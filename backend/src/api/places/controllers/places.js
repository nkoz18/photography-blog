'use strict';

module.exports = {
  async autocomplete(ctx) {
    const { input } = ctx.query;
    if (!input) return ctx.badRequest('input is required');
    const data = await strapi.service('api::places.places').autocomplete(input);
    ctx.body = data;
  },
  async details(ctx) {
    const { place_id } = ctx.query;
    if (!place_id) return ctx.badRequest('place_id is required');
    const data = await strapi.service('api::places.places').details(place_id);
    ctx.body = data;
  },
};