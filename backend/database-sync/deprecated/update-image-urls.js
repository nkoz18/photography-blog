#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');

async function updateImageUrls() {
  console.log('🔄 Updating S3 image URLs to use local proxy...');
  
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get all files from upload plugin
    const files = await strapi.query('plugin::upload.file').findMany();
    
    console.log(`📁 Found ${files.length} files to process`);
    
    let updatedCount = 0;
    
    for (const file of files) {
      if (file.url && file.url.includes('nikita-strapi-uploads.s3.us-west-2.amazonaws.com')) {
        // Extract the path from the S3 URL
        const s3Path = file.url.replace('https://nikita-strapi-uploads.s3.us-west-2.amazonaws.com/', '');
        
        // Create the local proxy URL
        const localProxyUrl = `/api/image-proxy/${s3Path}`;
        
        // Update the file
        await strapi.query('plugin::upload.file').update({
          where: { id: file.id },
          data: {
            url: localProxyUrl
          }
        });
        
        console.log(`  ✅ Updated: ${file.name} -> ${localProxyUrl}`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  Skipped: ${file.name} (not S3 URL)`);
      }
    }
    
    console.log(`🎉 Updated ${updatedCount} files to use local proxy URLs`);
    console.log('');
    console.log('💡 Images will now be served through: http://localhost:1337/api/image-proxy/[path]');
    console.log('   This proxy fetches images from S3 and serves them locally');
    
  } catch (error) {
    console.error('❌ Error updating image URLs:', error.message);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  updateImageUrls().catch(console.error);
}

module.exports = updateImageUrls;