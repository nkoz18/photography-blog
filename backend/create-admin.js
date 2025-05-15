/**
 * Script to create an admin user programmatically
 * Usage: node create-admin.js
 */

const fs = require("fs");
const crypto = require("crypto");

async function createAdmin() {
  try {
    const { default: strapiPkg } = await import("@strapi/strapi");
    const strapi = await strapiPkg().load();

    await strapi.admin.bootstrap();

    try {
      // Try to find existing admin users
      const adminUsers = await strapi.query("admin::user").findMany();

      if (adminUsers && adminUsers.length > 0) {
        console.log("Admin users already exist:");
        adminUsers.forEach((user) => {
          console.log(`- ${user.email} (${user.firstname} ${user.lastname})`);
        });
      } else {
        // Create admin user
        const params = {
          username: "admin",
          password: "Admin123!",
          firstname: "Admin",
          lastname: "User",
          email: "admin@example.com",
          isActive: true,
          roles: [1], // Assign the Super Admin role
        };

        console.log("Creating admin user...");
        await strapi.admin.services.user.create({
          email: params.email,
          firstname: params.firstname,
          lastname: params.lastname,
          password: params.password,
          registrationToken: null,
          isActive: true,
          roles: [1],
        });

        console.log("Admin user created successfully!");
        console.log("Email:", params.email);
        console.log("Password:", params.password);
      }
    } catch (e) {
      console.error("Could not create/check admin user:", e);
    }

    // Check if the global content type exists
    try {
      const globalEntry = await strapi.entityService.findMany(
        "api::global.global"
      );

      if (!globalEntry || globalEntry.length === 0) {
        console.log("Creating default global content...");

        // Create default global settings
        await strapi.entityService.create("api::global.global", {
          data: {
            siteName: "Silky Truth Photography",
            defaultSeo: {
              metaTitle: "Silky Truth Photography",
              metaDescription: "Beautiful photography from around the world",
            },
            publishedAt: new Date(),
          },
        });

        console.log("Default global content created!");
      } else {
        console.log("Global content already exists.");
      }
    } catch (e) {
      console.error("Could not check/create global content:", e);
    }

    await strapi.destroy();
  } catch (e) {
    console.error("Could not initialize strapi:", e);
  }
}

createAdmin();
