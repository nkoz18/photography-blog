#!/usr/bin/env node

const axios = require('axios');

const LOCAL_API = 'http://localhost:1337';

async function fixAuthors() {
  try {
    console.log('🔧 Fixing article author relationships...');
    
    // Get all writers
    const writersResponse = await axios.get(`${LOCAL_API}/api/writers`);
    const writers = writersResponse.data.data;
    
    console.log('📋 Available writers:');
    writers.forEach(writer => {
      console.log(`   ID ${writer.id}: ${writer.attributes.name} (${writer.attributes.email})`);
    });
    
    // Find Nikita Kozlov
    const nikita = writers.find(w => w.attributes.name === 'Nikita Kozlov');
    if (!nikita) {
      console.log('❌ Nikita Kozlov not found in writers');
      return;
    }
    
    console.log(`🎯 Using writer ID ${nikita.id} for Nikita Kozlov`);
    
    // Get all articles
    const articlesResponse = await axios.get(`${LOCAL_API}/api/articles?populate=author`);
    const articles = articlesResponse.data.data;
    
    console.log(`📚 Found ${articles.length} articles`);
    
    // Update articles that don't have authors
    for (const article of articles) {
      if (!article.attributes.author?.data) {
        console.log(`🔄 Updating "${article.attributes.title}" (ID: ${article.id})`);
        
        try {
          await axios.put(`${LOCAL_API}/api/articles/${article.id}`, {
            data: {
              author: nikita.id
            }
          });
          console.log(`   ✅ Updated successfully`);
        } catch (error) {
          console.log(`   ❌ Failed: ${error.response?.data?.error?.message || error.message}`);
        }
      } else {
        console.log(`   ℹ️  "${article.attributes.title}" already has author: ${article.attributes.author.data.attributes.name}`);
      }
    }
    
    console.log('🎉 Author fix completed!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (!command) {
    fixAuthors();
  } else {
    console.log('Usage: node fix-authors.js');
  }
}

module.exports = { fixAuthors };