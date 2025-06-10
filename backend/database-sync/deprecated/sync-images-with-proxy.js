#!/usr/bin/env node

const axios = require('axios');

async function syncImagesWithProxy() {
  console.log('🔄 Re-syncing production data and updating image URLs for local proxy...');
  
  try {
    // Step 1: Get production data with images
    console.log('📥 Fetching production articles with images...');
    const prodResponse = await axios.get('https://api.silkytruth.com/api/articles?populate=*');
    const prodArticles = prodResponse.data.data;
    
    console.log(`Found ${prodArticles.length} articles in production`);
    
    // Step 2: Get local articles 
    console.log('📋 Getting local articles...');
    const localResponse = await axios.get('http://localhost:1337/api/articles');
    const localArticles = localResponse.data.data;
    
    // Step 3: Update each local article with proxy image URLs
    for (const localArticle of localArticles) {
      const matchingProdArticle = prodArticles.find(p => p.attributes.slug === localArticle.attributes.slug);
      
      if (matchingProdArticle) {
        console.log(`\n🔄 Processing: ${localArticle.attributes.title}`);
        
        let updateData = {};
        let hasUpdates = false;
        
        // Handle main image
        if (matchingProdArticle.attributes.image?.data?.attributes?.url) {
          const prodImageUrl = matchingProdArticle.attributes.image.data.attributes.url;
          if (prodImageUrl.includes('.s3.') || prodImageUrl.includes('.amazonaws.com')) {
            // Extract just the filename or use the full URL path
            const imagePath = prodImageUrl.replace('https://photography-blog-images.s3.us-west-2.amazonaws.com/', '');
            const proxyUrl = `http://localhost:1337/api/image-proxy/${imagePath}`;
            
            console.log(`  🖼️  Main image: ${imagePath} -> proxy`);
            
            // Create a mock file record for the image
            updateData.image = {
              data: {
                id: Date.now(), // temporary ID
                attributes: {
                  url: proxyUrl,
                  name: imagePath.split('/').pop(),
                  alternativeText: matchingProdArticle.attributes.image.data.attributes.alternativeText || '',
                  caption: matchingProdArticle.attributes.image.data.attributes.caption || '',
                  width: matchingProdArticle.attributes.image.data.attributes.width || null,
                  height: matchingProdArticle.attributes.image.data.attributes.height || null,
                }
              }
            };
            hasUpdates = true;
          }
        }
        
        // Update the article if we have changes
        if (hasUpdates) {
          try {
            await axios.put(`http://localhost:1337/api/articles/${localArticle.id}`, {
              data: updateData
            });
            console.log(`  ✅ Updated article with proxy URLs`);
          } catch (error) {
            console.log(`  ⚠️  Failed to update article: ${error.response?.data?.error?.message || error.message}`);
          }
        } else {
          console.log(`  ⏭️  No images to proxy`);
        }
      }
    }
    
    console.log('\n🎉 Image proxy sync completed!');
    console.log('💡 Articles now reference local proxy URLs for images');
    console.log('🌐 Start frontend with USE_CLOUD_BACKEND=false to see images locally');
    
  } catch (error) {
    console.error('❌ Error syncing images:', error.message);
  }
}

syncImagesWithProxy();