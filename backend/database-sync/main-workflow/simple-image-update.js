#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');
const axios = require('axios');

async function updateImageUrls() {
  console.log('🔄 Updating image URLs to use local proxy...');
  
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get production data
    console.log('📥 Fetching production images...');
    const prodResponse = await axios.get('https://api.silkytruth.com/api/articles?populate=image');
    const prodArticles = prodResponse.data.data;
    
    console.log(`Found ${prodArticles.length} production articles`);
    
    // Create file records for each image and update articles
    for (const prodArticle of prodArticles) {
      if (prodArticle.attributes.image?.data?.attributes?.url) {
        const imageData = prodArticle.attributes.image.data.attributes;
        const prodImageUrl = imageData.url;
        
        // Extract the filename from the S3 URL
        const imagePath = prodImageUrl.replace('https://photography-blog-images.s3.us-west-2.amazonaws.com/', '');
        const proxyUrl = `http://localhost:1337/api/image-proxy/${imagePath}`;
        
        console.log(`\n📰 Processing: ${prodArticle.attributes.title}`);
        console.log(`  🖼️  Image: ${imagePath}`);
        
        // Create a file record
        const fileRecord = await strapi.query('plugin::upload.file').create({
          data: {
            name: imageData.name,
            alternativeText: imageData.alternativeText || '',
            caption: imageData.caption || '',
            width: imageData.width,
            height: imageData.height,
            formats: imageData.formats || null,
            hash: imagePath.replace(/\.[^/.]+$/, ""), // Remove extension
            ext: '.' + imagePath.split('.').pop(),
            mime: 'image/jpeg',
            size: 100, // Dummy size
            url: proxyUrl,
            provider: 'local-proxy',
            provider_metadata: {}
          }
        });
        
        console.log(`  ✅ Created file record with ID: ${fileRecord.id}`);
        
        // Find the local article by slug
        const localArticle = await strapi.query('api::article.article').findOne({
          where: { slug: prodArticle.attributes.slug }
        });
        
        if (localArticle) {
          // Update the article to reference the new file
          await strapi.query('api::article.article').update({
            where: { id: localArticle.id },
            data: {
              image: fileRecord.id
            }
          });
          console.log(`  ✅ Updated article to use proxy image`);
        }
      }
    }
    
    console.log('\n🎉 Image URL update completed!');
    console.log('💡 Articles now use local proxy for images');
    
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