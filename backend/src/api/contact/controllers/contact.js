'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::contact.contact', ({ strapi }) => ({
  async create(ctx) {
    const { 
      name, phone, email, instagram, tiktok, facebook, youtube, whatsapp, snapchat, encounterSlug,
      deviceInfo, userAgent, browserName, browserVersion, deviceType, operatingSystem,
      screenResolution, viewportSize, timezone, language, referrer
    } = ctx.request.body;
    
    if (!phone && !email && !instagram && !tiktok && !facebook && !youtube && !whatsapp && !snapchat) {
      return ctx.badRequest('At least one contact method is required');
    }
    
    if (!encounterSlug) {
      return ctx.badRequest('Encounter slug is required');
    }
    
    try {
      const encounter = await strapi.entityService.findMany('api::photo-encounter.photo-encounter', {
        filters: { slug: encounterSlug },
        populate: { contacts: true }
      });
      
      if (!encounter || encounter.length === 0) {
        return ctx.notFound('Encounter not found');
      }
      
      const encounterData = encounter[0];
      
      // Check if there's already a contact associated with this encounter
      let existingContact = null;
      if (encounterData.contacts && encounterData.contacts.length > 0) {
        // Use the first contact as the "primary" contact for this encounter
        existingContact = encounterData.contacts[0];
      }
      
      // Get IP address from request
      const ipAddress = ctx.request.ip || 
                       ctx.request.headers['x-forwarded-for'] || 
                       ctx.request.headers['x-real-ip'] || 
                       ctx.request.connection?.remoteAddress ||
                       'unknown';

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
        // Device and browser information
        deviceInfo: deviceInfo || null,
        ipAddress: ipAddress,
        userAgent: userAgent || ctx.request.headers['user-agent'] || null,
        browserName: browserName || null,
        browserVersion: browserVersion || null,
        deviceType: deviceType || null,
        operatingSystem: operatingSystem || null,
        screenResolution: screenResolution || null,
        viewportSize: viewportSize || null,
        timezone: timezone || null,
        language: language || ctx.request.headers['accept-language'] || null,
        referrer: referrer || ctx.request.headers['referer'] || null,
        encounters: [encounterData.id]
      };
      
      let contact;
      if (existingContact) {
        // Update existing contact
        contact = await strapi.entityService.update('api::contact.contact', existingContact.id, {
          data: contactData
        });
        strapi.log.info(`Updated existing contact ${existingContact.id} for encounter ${encounterSlug}`);
      } else {
        // Create new contact
        contact = await strapi.entityService.create('api::contact.contact', {
          data: contactData
        });
        strapi.log.info(`Created new contact ${contact.id} for encounter ${encounterSlug}`);
      }
      
      return { success: true, contactId: contact.id, updated: !!existingContact };
    } catch (error) {
      strapi.log.error('Failed to create/update contact:', error);
      return ctx.internalServerError('Failed to create/update contact');
    }
  }
}));