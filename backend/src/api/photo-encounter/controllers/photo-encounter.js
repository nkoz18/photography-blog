'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::photo-encounter.photo-encounter', ({ strapi }) => ({
  async createFromCoords(ctx) {
    const { lat, lng, manualAddress, placeName, placeData, contactData } = ctx.request.body;
    
    if (!lat || !lng) {
      return ctx.badRequest('Latitude and longitude are required');
    }
    
    try {
      let address, finalPlaceName, finalPlaceData;
      
      if (manualAddress) {
        address = manualAddress;
        finalPlaceName = placeName || null;
        finalPlaceData = placeData || null;
      } else {
        const geoResult = await strapi.service('api::photo-encounter.geo').reverse(lat, lng);
        address = geoResult.address;
        finalPlaceName = geoResult.placeName;
        finalPlaceData = null;
      }
      
      // Generate a unique slug based on preferred name hierarchy
      let slugSource;
      if (finalPlaceName) {
        // Use place name if available (e.g., "Powell's Books")
        slugSource = finalPlaceName;
      } else if (address) {
        // Fall back to address
        slugSource = address;
      } else {
        // Last resort: coordinates
        slugSource = `location-${lat}-${lng}`;
      }
      
      const slugBase = slugSource.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 30); // Limit length
      
      const timestamp = Date.now();
      const slug = `${slugBase}-${timestamp}`;
      
      const encounter = await strapi.entityService.create('api::photo-encounter.photo-encounter', {
        data: {
          slug,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          address,
          placeName: finalPlaceName,
          placeData: finalPlaceData,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }
      });
      
      // If contact data was provided, create a contact and link it to the encounter
      let contactId = null;
      if (contactData && (contactData.name || contactData.email || contactData.instagram || contactData.phone)) {
        const contact = await strapi.entityService.create('api::contact.contact', {
          data: {
            name: contactData.name || null,
            email: contactData.email || null,
            instagram: contactData.instagram || null,
            phone: contactData.phone || null,
            encounters: [encounter.id]
          }
        });
        contactId = contact.id;
        
        // Update encounter to link the contact
        await strapi.entityService.update('api::photo-encounter.photo-encounter', encounter.id, {
          data: {
            contacts: [contactId]
          }
        });
      }
      
      return { 
        slug: encounter.slug, 
        address, 
        placeName: finalPlaceName,
        contactCreated: !!contactId 
      };
    } catch (error) {
      strapi.log.error('Failed to create encounter:', error);
      return ctx.internalServerError('Failed to create encounter');
    }
  }
}));