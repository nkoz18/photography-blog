
/*
 *
 * ============================================================
 * WARNING: THIS FILE HAS BEEN COMMENTED OUT
 * ============================================================
 *
 * CONTEXT:
 *
 * The lifecycles.js file has been commented out to prevent unintended side effects when starting Strapi 5 for the first time after migrating to the document service.
 *
 * STRAPI 5 introduces a new document service that handles lifecycles differently compared to previous versions. Without migrating your lifecycles to document service middlewares, you may experience issues such as:
 *
 * - `unpublish` actions triggering `delete` lifecycles for every locale with a published entity, which differs from the expected behavior in v4.
 * - `discardDraft` actions triggering both `create` and `delete` lifecycles, leading to potential confusion.
 *
 * MIGRATION GUIDE:
 *
 * For a thorough guide on migrating your lifecycles to document service middlewares, please refer to the following link:
 * [Document Services Middlewares Migration Guide](https://docs.strapi.io/dev-docs/migration/v4-to-v5/breaking-changes/lifecycle-hooks-document-service)
 *
 * IMPORTANT:
 *
 * Simply uncommenting this file without following the migration guide may result in unexpected behavior and inconsistencies. Ensure that you have completed the migration process before re-enabling this file.
 *
 * ============================================================
 */

// module.exports = {
//   async afterUpdate(event) {
//     const { result } = event;
//     
//     // Check if status was changed to 'ready'
//     if (result.status === 'ready') {
//       try {
//         // Fetch the encounter with all related contacts
//         const encounter = await strapi.entityService.findOne(
//           'api::photo-encounter.photo-encounter',
//           result.id,
//           {
//             populate: {
//               contacts: true
//             }
//           }
//         );
//         
//         if (!encounter || !encounter.contacts || encounter.contacts.length === 0) {
//           strapi.log.info('No contacts found for encounter:', result.slug);
//           return;
//         }
//         
//         const smsService = strapi.service('api::photo-encounter.sms');
//         const message = smsService.formatPhotoReadyMessage(encounter.placeName, encounter.slug);
//         
//         // Send SMS to all contacts with phone numbers
//         for (const contact of encounter.contacts) {
//           if (contact.phone && !contact.smsOptOut) {
//             try {
//               const smsResult = await smsService.send(contact.phone, message);
//               
//               // If user has opted out, update the contact record
//               if (smsResult.optedOut) {
//                 await strapi.entityService.update('api::contact.contact', contact.id, {
//                   data: { smsOptOut: true }
//                 });
//               }
//               
//             } catch (error) {
//               strapi.log.error(`Failed to send SMS to contact ${contact.id}:`, error);
//             }
//           }
//         }
//         
//         strapi.log.info(`SMS notifications sent for encounter: ${encounter.slug}`);
//         
//       } catch (error) {
//         strapi.log.error('Error in photo-encounter lifecycle hook:', error);
//       }
//     }
//   }
// };