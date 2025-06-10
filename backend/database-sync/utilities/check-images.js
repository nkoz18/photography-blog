#!/usr/bin/env node

const axios = require('axios');

async function checkImages() {
  try {
    console.log('🔍 Checking image data in articles...');
    
    const response = await axios.get('http://localhost:1337/api/articles?populate=*');
    const articles = response.data.data;
    
    console.log(`📄 Found ${articles.length} articles`);
    
    for (const article of articles) {
      console.log(`\n📰 Article: ${article.attributes.title}`);
      
      // Check main article image
      if (article.attributes.image?.data?.attributes?.url) {
        const imageUrl = article.attributes.image.data.attributes.url;
        console.log(`  🖼️  Main image: ${imageUrl}`);
        
        if (imageUrl.includes('nikita-strapi-uploads.s3.us-west-2.amazonaws.com')) {
          console.log('     ⚠️  This is an S3 URL that needs proxying');
        }
      } else {
        console.log('  📭 No main image');
      }
      
      // Check gallery images
      if (article.attributes.gallery?.images?.data?.length > 0) {
        console.log(`  🖼️  Gallery: ${article.attributes.gallery.images.data.length} images`);
        article.attributes.gallery.images.data.forEach((img, idx) => {
          if (img.attributes?.url) {
            console.log(`     ${idx + 1}. ${img.attributes.url}`);
          }
        });
      }
      
      // Check gallery items
      if (article.attributes.gallery?.gallery_items?.length > 0) {
        console.log(`  📸 Gallery items: ${article.attributes.gallery.gallery_items.length} items`);
        article.attributes.gallery.gallery_items.forEach((item, idx) => {
          if (item.image?.data?.attributes?.url) {
            console.log(`     ${idx + 1}. ${item.image.data.attributes.url}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking images:', error.message);
  }
}

checkImages();