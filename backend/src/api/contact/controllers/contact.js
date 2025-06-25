'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::contact.contact', ({ strapi }) => ({
  async create(ctx) {
    const { name, phone, email, instagram, tiktok, facebook, youtube, whatsapp, snapchat, encounterSlug } = ctx.request.body;
    
    if (!phone && !email && !instagram && !tiktok && !facebook && !youtube && !whatsapp && !snapchat) {
      return ctx.badRequest('At least one contact method is required');
    }
    
    if (!encounterSlug) {
      return ctx.badRequest('Encounter slug is required');
    }
    
    try {
      const encounter = await strapi.entityService.findMany('api::photo-encounter.photo-encounter', {
        filters: { slug: encounterSlug }
      });
      
      if (!encounter || encounter.length === 0) {
        return ctx.notFound('Encounter not found');
      }
      
      const contactData = {
        name: name,
        phone: phone || null,
        email: email || null,
        instagram: instagram || null,
        tiktok: tiktok || null,
        facebook: facebook || null,
        youtube: youtube || null,
        whatsapp: whatsapp || null,
        snapchat: snapchat || null,
        encounters: [encounter[0].id]
      };
      
      const contact = await strapi.entityService.create('api::contact.contact', {
        data: contactData
      });
      
      return { success: true, contactId: contact.id };
    } catch (error) {
      strapi.log.error('Failed to create contact:', error);
      return ctx.internalServerError('Failed to create contact');
    }
  }
}));