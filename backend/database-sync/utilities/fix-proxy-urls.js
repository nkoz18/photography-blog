#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');

async function fixProxyUrls() {
  console.log('🔧 Fixing all file URLs to use local proxy...');
  
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get all files
    const files = await strapi.query('plugin::upload.file').findMany();
    console.log(`Found ${files.length} files to process`);
    
    let updatedCount = 0;
    
    for (const file of files) {
      let hasUpdates = false;
      let updateData = {};
      
      // Fix main URL
      if (file.url && file.url.includes('photography-blog-images.s3.us-west-2.amazonaws.com')) {
        const imagePath = file.url.replace('https://photography-blog-images.s3.us-west-2.amazonaws.com/', '');
        const proxyUrl = `http://localhost:1337/api/image-proxy/${imagePath}`;
        updateData.url = proxyUrl;
        hasUpdates = true;
        console.log(`  🔄 ${file.name}: ${imagePath} -> proxy`);
      }
      
      // Fix formats URLs
      if (file.formats && typeof file.formats === 'object') {
        const newFormats = { ...file.formats };
        let formatsUpdated = false;
        
        for (const [formatName, formatData] of Object.entries(newFormats)) {
          if (formatData.url && formatData.url.includes('photography-blog-images.s3.us-west-2.amazonaws.com')) {
            const imagePath = formatData.url.replace('https://photography-blog-images.s3.us-west-2.amazonaws.com/', '');
            const proxyUrl = `http://localhost:1337/api/image-proxy/${imagePath}`;
            newFormats[formatName] = { ...formatData, url: proxyUrl };
            formatsUpdated = true;
          }
        }
        
        if (formatsUpdated) {
          updateData.formats = newFormats;
          hasUpdates = true;
        }
      }
      
      // Update the file if needed
      if (hasUpdates) {
        await strapi.query('plugin::upload.file').update({
          where: { id: file.id },
          data: updateData
        });
        updatedCount++;
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} files to use proxy URLs`);
    console.log('💡 All images now use local proxy for development');
    
  } catch (error) {
    console.error('❌ Error fixing proxy URLs:', error.message);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  fixProxyUrls().catch(console.error);
}

module.exports = fixProxyUrls;