#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');
const axios = require('axios');

async function syncAllImages() {
  console.log('🔄 Syncing ALL images (main + gallery) to use local proxy...');
  
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get production data with full population
    console.log('📥 Fetching production articles with all images...');
    const prodResponse = await axios.get('https://api.silkytruth.com/api/articles?populate=*');
    const prodArticles = prodResponse.data.data;
    
    console.log(`Found ${prodArticles.length} production articles`);
    
    // Helper function to create file record
    async function createFileRecord(imageData, imageName) {
      const prodImageUrl = imageData.url;
      const imagePath = prodImageUrl.replace('https://photography-blog-images.s3.us-west-2.amazonaws.com/', '');
      const proxyUrl = `http://localhost:1337/api/image-proxy/${imagePath}`;
      
      const fileRecord = await strapi.query('plugin::upload.file').create({
        data: {
          name: imageData.name || imageName,
          alternativeText: imageData.alternativeText || '',
          caption: imageData.caption || '',
          width: imageData.width,
          height: imageData.height,
          formats: imageData.formats || null,
          hash: imagePath.replace(/\.[^/.]+$/, ""), // Remove extension
          ext: '.' + imagePath.split('.').pop(),
          mime: imageData.mime || 'image/jpeg',
          size: imageData.size || 100,
          url: proxyUrl,
          provider: 'local-proxy',
          provider_metadata: {}
        }
      });
      
      console.log(`    ✅ Created file record: ${imageName} (ID: ${fileRecord.id})`);
      return fileRecord;
    }
    
    // Process each article
    for (const prodArticle of prodArticles) {
      console.log(`\n📰 Processing: ${prodArticle.attributes.title}`);
      
      const localArticle = await strapi.query('api::article.article').findOne({
        where: { slug: prodArticle.attributes.slug },
        populate: { gallery: { populate: { images: true, gallery_items: { populate: { image: true } } } } }
      });
      
      if (!localArticle) {
        console.log(`  ⚠️  Local article not found, skipping`);
        continue;
      }
      
      let articleUpdates = {};
      
      // Handle main article image
      if (prodArticle.attributes.image?.data?.attributes?.url) {
        console.log(`  🖼️  Main image found`);
        const fileRecord = await createFileRecord(
          prodArticle.attributes.image.data.attributes,
          'main-image'
        );
        articleUpdates.image = fileRecord.id;
      }
      
      // Handle gallery images
      if (prodArticle.attributes.gallery?.images?.data?.length > 0) {
        console.log(`  🖼️  Gallery images found: ${prodArticle.attributes.gallery.images.data.length}`);
        
        const galleryFileIds = [];
        for (let i = 0; i < prodArticle.attributes.gallery.images.data.length; i++) {
          const imageData = prodArticle.attributes.gallery.images.data[i].attributes;
          const fileRecord = await createFileRecord(imageData, `gallery-${i}`);
          galleryFileIds.push(fileRecord.id);
        }
        
        // Update gallery with new image IDs
        if (localArticle.gallery?.id) {
          await strapi.query('api::gallery.gallery').update({
            where: { id: localArticle.gallery.id },
            data: {
              images: galleryFileIds
            }
          });
          console.log(`    ✅ Updated gallery with ${galleryFileIds.length} images`);
        }
      }
      
      // Handle gallery items (individual gallery entries)
      if (prodArticle.attributes.gallery?.gallery_items?.length > 0) {
        console.log(`  📸 Gallery items found: ${prodArticle.attributes.gallery.gallery_items.length}`);
        
        for (let i = 0; i < prodArticle.attributes.gallery.gallery_items.length; i++) {
          const item = prodArticle.attributes.gallery.gallery_items[i];
          if (item.image?.data?.attributes?.url) {
            const fileRecord = await createFileRecord(
              item.image.data.attributes,
              `gallery-item-${i}`
            );
            
            // Update the gallery item if it exists locally
            if (localArticle.gallery?.gallery_items?.[i]?.id) {
              await strapi.query('api::gallery-item.gallery-item').update({
                where: { id: localArticle.gallery.gallery_items[i].id },
                data: {
                  image: fileRecord.id
                }
              });
              console.log(`    ✅ Updated gallery item ${i}`);
            }
          }
        }
      }
      
      // Update the main article if needed
      if (Object.keys(articleUpdates).length > 0) {
        await strapi.query('api::article.article').update({
          where: { id: localArticle.id },
          data: articleUpdates
        });
        console.log(`  ✅ Updated article with new image references`);
      }
    }
    
    console.log('\n🎉 All images sync completed!');
    console.log('💡 Articles now have main images AND gallery images via proxy');
    
  } catch (error) {
    console.error('❌ Error syncing images:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  syncAllImages().catch(console.error);
}

module.exports = syncAllImages;