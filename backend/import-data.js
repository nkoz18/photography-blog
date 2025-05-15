const fs = require("fs");
const path = require("path");

/**
 * Import data from data.json file
 * Run this script after creating an admin user and API tokens
 */
async function importData() {
  try {
    console.log("Starting data import...");

    // Read the data.json file
    const dataPath = path.join(__dirname, "data", "data.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    console.log("Data loaded from file, importing...");

    // Initialize Strapi
    const strapi = require("@strapi/strapi");
    const app = strapi({ autoReload: false });
    await app.load();

    // Import categories
    console.log("Importing categories...");
    for (const category of data.categories) {
      const existing = await app.db.query("api::category.category").findOne({
        where: { slug: category.slug },
      });

      if (!existing) {
        await app.db.query("api::category.category").create({
          data: category,
        });
        console.log(`Created category: ${category.name}`);
      } else {
        console.log(`Category already exists: ${category.name}`);
      }
    }

    // Import writers
    console.log("Importing writers...");
    for (const writer of data.writers) {
      const existing = await app.db.query("api::writer.writer").findOne({
        where: { email: writer.email },
      });

      if (!existing) {
        await app.db.query("api::writer.writer").create({
          data: writer,
        });
        console.log(`Created writer: ${writer.name}`);
      } else {
        console.log(`Writer already exists: ${writer.name}`);
      }
    }

    // Import articles
    console.log("Importing articles...");
    for (const article of data.articles) {
      const existing = await app.db.query("api::article.article").findOne({
        where: { slug: article.slug },
      });

      if (!existing) {
        await app.db.query("api::article.article").create({
          data: article,
        });
        console.log(`Created article: ${article.title}`);
      } else {
        console.log(`Article already exists: ${article.title}`);
      }
    }

    // Import global
    console.log("Importing global settings...");
    const existingGlobal = await app.db.query("api::global.global").findOne();

    if (!existingGlobal) {
      await app.db.query("api::global.global").create({
        data: data.global,
      });
      console.log("Created global settings");
    } else {
      console.log("Global settings already exist");
    }

    // Import homepage
    console.log("Importing homepage...");
    const existingHomepage = await app.db
      .query("api::homepage.homepage")
      .findOne();

    if (!existingHomepage) {
      await app.db.query("api::homepage.homepage").create({
        data: data.homepage,
      });
      console.log("Created homepage");
    } else {
      console.log("Homepage already exists");
    }

    console.log("Data import completed successfully!");
    await app.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Error importing data:", error);
    process.exit(1);
  }
}

importData();
