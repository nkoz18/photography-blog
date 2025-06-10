#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');

async function configurePermissions() {
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

    // Define permissions we want to enable
    const permissionsToEnable = [
      'api::article.article.create',
      'api::article.article.update',
      'api::category.category.create',
      'api::writer.writer.create',
      'api::global.global.update',
      'api::homepage.homepage.update'
    ];

    for (const permission of permissionsToEnable) {
      const [api, controller, action] = permission.split('.');
      
      try {
        // Check if permission already exists
        const existingPermission = await strapi.query('plugin::users-permissions.permission').findOne({
          where: {
            action: permission,
            role: publicRole.id
          }
        });

        if (!existingPermission) {
          // Create the permission
          await strapi.query('plugin::users-permissions.permission').create({
            data: {
              action: permission,
              subject: null,
              properties: {},
              conditions: [],
              role: publicRole.id
            }
          });
          console.log(`✅ Enabled public access for ${permission}`);
        } else {
          console.log(`⚠️  Permission ${permission} already exists`);
        }
      } catch (error) {
        console.error(`❌ Failed to enable ${permission}:`, error.message);
      }
    }

    console.log('🎉 Permission configuration complete!');
    console.log('📝 Note: Remember to revert these permissions after data import');
    
  } catch (error) {
    console.error('Error configuring permissions:', error);
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  configurePermissions().catch(console.error);
}

module.exports = configurePermissions;