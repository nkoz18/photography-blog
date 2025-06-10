#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');

async function cleanupPermissions() {
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get the 'public' role
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' }
    });

    if (!publicRole) {
      console.error('Public role not found');
      return;
    }

    // Define permissions we want to remove
    const permissionsToRemove = [
      'api::article.article.create',
      'api::category.category.create',
      'api::writer.writer.create',
      'api::global.global.update',
      'api::homepage.homepage.update'
    ];

    for (const permission of permissionsToRemove) {
      try {
        // Find and delete the permission
        const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
          where: {
            action: permission,
            role: publicRole.id
          }
        });

        if (existingPermission) {
          await strapi.query('plugin::users-permissions.permission').delete({
            where: { id: existingPermission.id }
          });
          console.log(`🔒 Removed public access for ${permission}`);
        } else {
          console.log(`⚠️  Permission ${permission} not found`);
        }
      } catch (error) {
        console.error(`❌ Failed to remove ${permission}:`, error.message);
      }
    }

    console.log('🔐 Permission cleanup complete!');
    console.log('✅ API endpoints are now secured');
    
  } catch (error) {
    console.error('Error cleaning up permissions:', error);
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  cleanupPermissions().catch(console.error);
}

module.exports = cleanupPermissions;