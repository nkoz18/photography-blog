#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const PRODUCTION_API = 'https://api.silkytruth.com';
const LOCAL_API = 'http://localhost:1337';

async function exportProductionData() {
  console.log('🔄 Exporting ALL data from production...');
  
  try {
    const exportData = {};
    
    // Export all content types with full population
    const contentTypes = [
      { name: 'writers', populate: '*' },
      { name: 'categories', populate: '*' },
      { name: 'articles', populate: '*' },
      { name: 'global', populate: '*' },
      { name: 'homepage', populate: '*' }
    ];
    
    for (const { name, populate } of contentTypes) {
      console.log(`  📥 Fetching ${name}...`);
      
      try {
        const response = await axios.get(`${PRODUCTION_API}/api/${name}`, {
          params: { populate }
        });
        
        if (name === 'global' || name === 'homepage') {
          exportData[name] = response.data.data;
        } else {
          exportData[name] = response.data.data || [];
        }
        
        const count = Array.isArray(exportData[name]) ? exportData[name].length : 'single';
        console.log(`  ✅ ${name}: ${count} item${count === 1 ? '' : 's'}`);
      } catch (error) {
        console.log(`  ⚠️  ${name}: ${error.response?.status || error.message}`);
        exportData[name] = null;
      }
    }
    
    // Save to file
    fs.writeFileSync('/tmp/production_full_export.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Full export completed: /tmp/production_full_export.json');
    
    return exportData;
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  }
}

async function importDataToLocal() {
  console.log('🔄 Importing ALL data to fresh local database...');
  
  try {
    const data = JSON.parse(fs.readFileSync('/tmp/production_full_export.json', 'utf8'));
    
    // Step 1: Import writers first (referenced by articles)
    if (data.writers && data.writers.length > 0) {
      console.log('  📤 Importing writers...');
      for (const writer of data.writers) {
        try {
          const response = await axios.post(`${LOCAL_API}/api/writers`, {
            data: {
              name: writer.attributes.name,
              email: writer.attributes.email
            }
          });
          console.log(`    ✅ Created writer: ${writer.attributes.name}`);
        } catch (error) {
          console.log(`    ⚠️  Writer ${writer.attributes.name}: ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }
    
    // Step 2: Import categories (referenced by articles) 
    if (data.categories && data.categories.length > 0) {
      console.log('  📤 Importing categories...');
      for (const category of data.categories) {
        try {
          const response = await axios.post(`${LOCAL_API}/api/categories`, {
            data: {
              name: category.attributes.name,
              slug: category.attributes.slug
            }
          });
          console.log(`    ✅ Created category: ${category.attributes.name}`);
        } catch (error) {
          console.log(`    ⚠️  Category ${category.attributes.name}: ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }
    
    // Step 3: Get local writers and categories for mapping
    console.log('  🔗 Getting local references for articles...');
    const localWriters = await axios.get(`${LOCAL_API}/api/writers`);
    const localCategories = await axios.get(`${LOCAL_API}/api/categories`);
    
    const writerMap = {};
    localWriters.data.data.forEach(writer => {
      writerMap[writer.attributes.name] = writer.id;
    });
    
    const categoryMap = {};
    localCategories.data.data.forEach(category => {
      categoryMap[category.attributes.slug] = category.id;
    });
    
    // Step 4: Import articles with proper relations
    if (data.articles && data.articles.length > 0) {
      console.log('  📤 Importing articles...');
      for (const article of data.articles) {
        try {
          // Map author relation
          let authorId = null;
          if (article.attributes.author?.data?.attributes?.name) {
            authorId = writerMap[article.attributes.author.data.attributes.name];
          }
          
          // Map category relations
          const categoryIds = [];
          if (article.attributes.categories?.data) {
            for (const cat of article.attributes.categories.data) {
              const localId = categoryMap[cat.attributes.slug];
              if (localId) categoryIds.push(localId);
            }
          }
          
          const articleData = {
            title: article.attributes.title,
            description: article.attributes.description,
            content: article.attributes.content,
            slug: article.attributes.slug,
            publishedAt: article.attributes.publishedAt,
            author: authorId,
            categories: categoryIds
            // Skip image relations for now since we don't have the files locally
          };
          
          const response = await axios.post(`${LOCAL_API}/api/articles`, {
            data: articleData
          });
          console.log(`    ✅ Created article: ${article.attributes.title}`);
        } catch (error) {
          console.log(`    ⚠️  Article ${article.attributes.title}: ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }
    
    // Step 5: Import global settings (single-type, use PUT)
    if (data.global) {
      console.log('  📤 Importing global settings...');
      try {
        const response = await axios.put(`${LOCAL_API}/api/global`, {
          data: data.global.attributes
        });
        console.log('    ✅ Updated global settings');
      } catch (error) {
        console.log(`    ⚠️  Global settings: ${error.response?.data?.error?.message || error.message}`);
      }
    }
    
    // Step 6: Import homepage (single-type, use PUT)
    if (data.homepage) {
      console.log('  📤 Importing homepage...');
      try {
        const response = await axios.put(`${LOCAL_API}/api/homepage`, {
          data: data.homepage.attributes
        });
        console.log('    ✅ Updated homepage');
      } catch (error) {
        console.log(`    ⚠️  Homepage: ${error.response?.data?.error?.message || error.message}`);
      }
    }
    
    console.log('🎉 Full import completed!');
    console.log('📊 Summary:');
    console.log(`   Writers: ${data.writers?.length || 0}`);
    console.log(`   Categories: ${data.categories?.length || 0}`);
    console.log(`   Articles: ${data.articles?.length || 0}`);
    console.log(`   Global: ${data.global ? '✅' : '❌'}`);
    console.log(`   Homepage: ${data.homepage ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

async function fullSync() {
  console.log('🚀 Starting FULL production to local sync...');
  await exportProductionData();
  await importDataToLocal();
  console.log('✅ Full sync completed!');
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'export') {
    await exportProductionData();
  } else if (action === 'import') {
    await importDataToLocal();
  } else if (action === 'sync' || !action) {
    await fullSync();
  } else {
    console.log('Usage: node full-sync.js [export|import|sync]');
    console.log('  export - Export all data from production');
    console.log('  import - Import all data to local');
    console.log('  sync   - Export then import (default)');
  }
}

main().catch(console.error);