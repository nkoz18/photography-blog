const fs = require("fs");
const path = require("path");

async function createAdmin() {
  try {
    // Make sure Strapi is initialized
    const Strapi = require("@strapi/strapi");
    const strapi = new Strapi();
    await strapi.load();

    const params = {
      username: "admin",
      password: "Password123!",
      firstname: "Admin",
      lastname: "User",
      email: "admin@example.com",
      blocked: false,
      isActive: true,
    };

    // Check if admin already exists
    const existingAdmin = await strapi.query("admin::user").findOne({
      where: { email: params.email },
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      await strapi.destroy();
      process.exit(0);
    }

    // Create admin
    const admin = await strapi.admin.services.user.create({
      email: params.email,
      firstname: params.firstname,
      username: params.username,
      lastname: params.lastname,
      password: params.password,
      registrationToken: null,
      isActive: true,
      roles: [1], // Superadmin role
    });

    console.log("Admin user created:", admin);
    await strapi.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdmin();
