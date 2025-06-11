#!/usr/bin/env node

const axios = require('axios');

async function verifySetup() {
  console.log('🔍 Verifying local development setup...\n');
  
  try {
    // Test 1: Backend API
    console.log('1️⃣ Testing backend API...');
    const backendResponse = await axios.get('http://localhost:1337/api/articles?populate=image');
    const articles = backendResponse.data.data;
    console.log(`   ✅ Backend API working - Found ${articles.length} articles`);
    
    // Test 2: Image URLs in articles
    console.log('\n2️⃣ Checking image URLs in articles...');
    let imagesFound = 0;
    for (const article of articles) {
      if (article.attributes.image?.data?.attributes?.url) {
        const imageUrl = article.attributes.image.data.attributes.url;
        console.log(`   📄 ${article.attributes.title}`);
        console.log(`      🖼️  Image: ${imageUrl}`);
        if (imageUrl.includes('localhost:1337/api/image-proxy/')) {
          console.log(`      ✅ Using local proxy`);
          imagesFound++;
        } else {
          console.log(`      ⚠️  Not using local proxy`);
        }
      }
    }
    console.log(`   📊 ${imagesFound}/${articles.length} articles have proxy images`);
    
    // Test 3: Image proxy endpoint
    console.log('\n3️⃣ Testing image proxy...');
    if (imagesFound > 0) {
      const testArticle = articles.find(a => a.attributes.image?.data?.attributes?.url?.includes('localhost:1337/api/image-proxy/'));
      if (testArticle) {
        const imageUrl = testArticle.attributes.image.data.attributes.url;
        const proxyResponse = await axios.head(imageUrl);
        console.log(`   ✅ Image proxy working - Status: ${proxyResponse.status}`);
      }
    } else {
      console.log(`   ⚠️  No proxy images to test`);
    }
    
    // Test 4: Frontend
    console.log('\n4️⃣ Testing frontend...');
    try {
      const frontendResponse = await axios.get('http://localhost:3000', { timeout: 3000 });
      console.log(`   ✅ Frontend accessible - Status: ${frontendResponse.status}`);
    } catch (error) {
      console.log(`   ⚠️  Frontend not accessible: ${error.message}`);
    }
    
    console.log('\n🎉 Local development setup verification complete!');
    console.log('\n📋 Summary:');
    console.log(`   • Backend: http://localhost:1337 ${backendResponse.status === 200 ? '✅' : '❌'}`);
    console.log(`   • Frontend: http://localhost:3000 (check manually)`);
    console.log(`   • Images: ${imagesFound} articles with proxy images`);
    console.log(`   • Image Proxy: http://localhost:1337/api/image-proxy/[filename]`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySetup();