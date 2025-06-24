'use strict';

module.exports = {
  async exists(ctx) {
    const { handle = '' } = ctx.query;
    
    if (!handle) {
      return ctx.badRequest('handle is required');
    }
    
    // Validate handle format
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
      return ctx.badRequest('Invalid handle format');
    }
    
    try {
      const exists = await strapi.service('api::instagram.instagram').exists(handle);
      ctx.body = { exists }; // true | false | null
    } catch (error) {
      strapi.log.error('Instagram exists check failed:', error);
      ctx.body = { exists: null }; // Return unknown on error
    }
  },
};