#!/usr/bin/env node

const strapiFactory = require('@strapi/strapi');
const axios = require('axios');

async function syncAllGalleries() {
  console.log('🔄 Syncing ALL gallery images for local development...');
  
  const strapi = await strapiFactory({ dir: process.cwd() }).load();

  try {
    // Get all local articles
    console.log('📥 Fetching local articles...');
    const localArticles = await strapi.query('api::article.article').findMany({
      populate: { gallery: true }
    });
    
    console.log(`Found ${localArticles.length} local articles`);
    
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
    
    // Process each local article
    for (const localArticle of localArticles) {
      console.log(`\n📰 Processing: ${localArticle.title} (Local ID: ${localArticle.id})`);
      
      // Skip if already has gallery
      if (localArticle.gallery && localArticle.gallery.id) {
        console.log(`  ✅ Already has gallery, skipping`);
        continue;
      }
      
      // Fetch production article by slug
      try {
        console.log(`  🔍 Fetching production data for slug: ${localArticle.slug}`);
        const prodResponse = await axios.get(`https://api.silkytruth.com/api/articles?filters[slug][$eq]=${localArticle.slug}&populate=gallery.gallery_items.image`);
        
        if (!prodResponse.data.data || prodResponse.data.data.length === 0) {
          console.log(`  ⚠️  No production article found with slug: ${localArticle.slug}`);
          continue;
        }
        
        const prodArticle = prodResponse.data.data[0];
        
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
          
          // Create new gallery and associate with article
          const newGallery = await strapi.query('sections.image-gallery').create({
            data: {
              caption: prodArticle.attributes.gallery.caption || `Gallery for ${localArticle.title}`,
              gallery_items: newGalleryItems
            }
          });
          
          await strapi.query('api::article.article').update({
            where: { id: localArticle.id },
            data: {
              gallery: newGallery.id
            }
          });
          console.log(`    ✅ Created new gallery with ${newGalleryItems.length} items`);
        } else {
          console.log(`  📭 No gallery items found in production`);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Error fetching production article: ${error.response?.status || error.message}`);
      }
    }
    
    console.log('\n🎉 All galleries sync completed!');
    console.log('💡 All articles now have gallery images via local proxy');
    
  } catch (error) {
    console.error('❌ Error syncing galleries:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await strapi.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  syncAllGalleries().catch(console.error);
}

module.exports = syncAllGalleries;