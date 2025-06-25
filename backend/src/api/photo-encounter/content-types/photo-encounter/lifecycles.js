module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    
    // Check if status was changed to 'ready'
    if (result.status === 'ready') {
      try {
        // Fetch the encounter with all related contacts
        const encounter = await strapi.entityService.findOne(
          'api::photo-encounter.photo-encounter',
          result.id,
          {
            populate: {
              contacts: true
            }
          }
        );
        
        if (!encounter || !encounter.contacts || encounter.contacts.length === 0) {
          strapi.log.info('No contacts found for encounter:', result.slug);
          return;
        }
        
        const smsService = strapi.service('api::photo-encounter.sms');
        const message = smsService.formatPhotoReadyMessage(encounter.placeName, encounter.slug);
        
        // Send SMS to all contacts with phone numbers
        for (const contact of encounter.contacts) {
          if (contact.phone && !contact.smsOptOut) {
            try {
              const smsResult = await smsService.send(contact.phone, message);
              
              // If user has opted out, update the contact record
              if (smsResult.optedOut) {
                await strapi.entityService.update('api::contact.contact', contact.id, {
                  data: { smsOptOut: true }
                });
              }
              
            } catch (error) {
              strapi.log.error(`Failed to send SMS to contact ${contact.id}:`, error);
            }
          }
        }
        
        strapi.log.info(`SMS notifications sent for encounter: ${encounter.slug}`);
        
      } catch (error) {
        strapi.log.error('Error in photo-encounter lifecycle hook:', error);
      }
    }
  }
};