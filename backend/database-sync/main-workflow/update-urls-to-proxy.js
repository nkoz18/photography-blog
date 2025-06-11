const { Client } = require('pg');

async function updateUrlsToProxy() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'strapi',
    password: 'localpass',
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Get all files with S3 URLs
    const result = await client.query(`
      SELECT id, name, url, formats 
      FROM files 
      WHERE url LIKE '%s3%amazonaws%'
      LIMIT 1000
    `);

    console.log(`Found ${result.rows.length} files with S3 URLs`);

    for (const file of result.rows) {
      // Extract filename from S3 URL
      const filename = file.url.split("/").pop();
      const proxyUrl = `http://localhost:1337/api/image-proxy/${filename}`;

      // Update formats if they exist
      let updatedFormats = file.formats;
      if (file.formats) {
        updatedFormats = {};
        for (const [key, format] of Object.entries(file.formats)) {
          const formatFilename = format.url.split("/").pop();
          updatedFormats[key] = {
            ...format,
            url: `http://localhost:1337/api/image-proxy/${formatFilename}`,
          };
        }
      }

      // Update the file URL and formats
      await client.query(
        `UPDATE files 
         SET url = $1, formats = $2, updated_at = NOW() 
         WHERE id = $3`,
        [proxyUrl, JSON.stringify(updatedFormats), file.id]
      );

      console.log(`Updated: ${file.name} -> ${proxyUrl}`);
    }

    console.log("All URLs updated to use local proxy!");
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Error updating URLs:", error);
    await client.end();
    process.exit(1);
  }
}

updateUrlsToProxy();