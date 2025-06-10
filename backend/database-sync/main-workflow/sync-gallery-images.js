#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');
const axios = require('axios');

async function syncGalleryImages() {
  console.log('🔄 Syncing gallery images for local development...');
  
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get production articles with deep gallery population
    console.log('📥 Fetching production articles with gallery data...');
    
    const prodArticles = [];
    const articleIds = [7, 6, 5]; // Based on what we saw in the API
    
    for (const id of articleIds) {
      try {
        const response = await axios.get(`https://api.silkytruth.com/api/articles/${id}?populate=gallery.gallery_items.image`);
        if (response.data.data) {
          prodArticles.push(response.data.data);
        }
      } catch (error) {
        console.log(`⚠️  Could not fetch article ${id}: ${error.response?.status || error.message}`);
      }
    }
    
    console.log(`Found ${prodArticles.length} production articles with gallery data`);
    
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
      
      return fileRecord;
    }
    
    // Process each article
    for (const prodArticle of prodArticles) {
      console.log(`\n📰 Processing: ${prodArticle.attributes.title}`);
      
      // Find local article
      const localArticle = await strapi.query('api::article.article').findOne({
        where: { slug: prodArticle.attributes.slug },
        populate: { gallery: true }
      });
      
      if (!localArticle) {
        console.log(`  ⚠️  Local article not found, skipping`);
        continue;
      }
      
      // Process gallery items
      if (prodArticle.attributes.gallery?.gallery_items?.length > 0) {
        const galleryItems = prodArticle.attributes.gallery.gallery_items;
        console.log(`  📸 Found ${galleryItems.length} gallery items`);
        
        const newGalleryItems = [];
        
        for (let i = 0; i < galleryItems.length; i++) {
          const item = galleryItems[i];
          if (item.image?.data?.attributes?.url) {
            console.log(`    ${i + 1}. ${item.image.data.attributes.name || `gallery-item-${i}`}`);
            
            const fileRecord = await createFileRecord(
              item.image.data.attributes,
              `gallery-item-${i}`
            );
            
            // Create gallery item component
            const galleryItem = await strapi.query('sections.gallery-item').create({
              data: {
                image: fileRecord.id,
                caption: item.caption || '',
                alt_text: item.alt_text || '',
                display_size: item.display_size || 'medium'
              }
            });
            
            newGalleryItems.push(galleryItem.id);
            console.log(`      ✅ Created gallery item (ID: ${galleryItem.id})`);
          }
        }
        
        // Create or update the gallery component
        let galleryData = {
          caption: prodArticle.attributes.gallery.caption || '',
          gallery_items: newGalleryItems
        };
        
        if (localArticle.gallery?.id) {
          // Update existing gallery
          await strapi.query('sections.image-gallery').update({
            where: { id: localArticle.gallery.id },
            data: galleryData
          });
          console.log(`    ✅ Updated existing gallery with ${newGalleryItems.length} items`);
        } else {
          // Create new gallery and associate with article
          const newGallery = await strapi.query('sections.image-gallery').create({
            data: galleryData
          });
          
          await strapi.query('api::article.article').update({
            where: { id: localArticle.id },
            data: {
              gallery: newGallery.id
            }
          });
          console.log(`    ✅ Created new gallery with ${newGalleryItems.length} items`);
        }
      } else {
        console.log(`  📭 No gallery items found`);
      }
    }
    
    console.log('\n🎉 Gallery images sync completed!');
    console.log('💡 Articles now have gallery images via local proxy');
    
  } catch (error) {
    console.error('❌ Error syncing gallery images:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  syncGalleryImages().catch(console.error);
}

module.exports = syncGalleryImages;