#!/usr/bin/env node

const fs = require('fs');
const axios = require('axios');

const PRODUCTION_API = 'https://api.silkytruth.com';

async function exportProductionData() {
  console.log('🔄 Exporting ALL data from production...');
  
  try {
    const exportData = {};
    
    // Export all content types with full population
    const contentTypes = [
      { name: 'writers', populate: '*' },
      { name: 'categories', populate: '*' },
      { name: 'articles', populate: '*' },
      { name: 'photo-encounters', populate: '*' },
      { name: 'contacts', populate: '*' },
      { name: 'global', populate: '*' },
      { name: 'homepage', populate: '*' }
    ];
    
    for (const { name, populate } of contentTypes) {
      console.log(`  📥 Fetching ${name}...`);
      
      try {
        const params = { populate };
        // For articles, include unlisted ones
        if (name === 'articles') {
          params.bypassListedFilter = true;
        }
        
        const response = await axios.get(`${PRODUCTION_API}/api/${name}`, {
          params
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
    
    // Initialize Strapi
    const strapi = require('@strapi/strapi');
    const app = strapi({ autoReload: false });
    await app.load();
    
    // Step 1: Import writers first (referenced by articles)
    if (data.writers && data.writers.length > 0) {
      console.log('  📤 Importing writers...');
      for (const writer of data.writers) {
        try {
          const existing = await app.db.query('api::writer.writer').findOne({
            where: { email: writer.attributes.email }
          });
          
          if (!existing) {
            await app.db.query('api::writer.writer').create({
              data: {
                name: writer.attributes.name,
                email: writer.attributes.email,
                publishedAt: writer.attributes.publishedAt
              }
            });
            console.log(`    ✅ Created writer: ${writer.attributes.name}`);
          } else {
            console.log(`    ⚠️  Writer already exists: ${writer.attributes.name}`);
          }
        } catch (error) {
          console.log(`    ❌ Writer ${writer.attributes.name}: ${error.message}`);
        }
      }
    }
    
    // Step 2: Import categories (referenced by articles)
    if (data.categories && data.categories.length > 0) {
      console.log('  📤 Importing categories...');
      for (const category of data.categories) {
        try {
          const existing = await app.db.query('api::category.category').findOne({
            where: { slug: category.attributes.slug }
          });
          
          if (!existing) {
            await app.db.query('api::category.category').create({
              data: {
                name: category.attributes.name,
                slug: category.attributes.slug,
                publishedAt: category.attributes.publishedAt
              }
            });
            console.log(`    ✅ Created category: ${category.attributes.name}`);
          } else {
            console.log(`    ⚠️  Category already exists: ${category.attributes.name}`);
          }
        } catch (error) {
          console.log(`    ❌ Category ${category.attributes.name}: ${error.message}`);
        }
      }
    }
    
    // Step 3: Import photo-encounters (independent content)
    if (data['photo-encounters'] && data['photo-encounters'].length > 0) {
      console.log('  📤 Importing photo-encounters...');
      for (const encounter of data['photo-encounters']) {
        try {
          const existing = await app.db.query('api::photo-encounter.photo-encounter').findOne({
            where: { slug: encounter.attributes.slug }
          });
          
          if (!existing) {
            await app.db.query('api::photo-encounter.photo-encounter').create({
              data: {
                slug: encounter.attributes.slug,
                lat: encounter.attributes.lat,
                lng: encounter.attributes.lng,
                address: encounter.attributes.address,
                placeName: encounter.attributes.placeName,
                status: encounter.attributes.status,
                timestamp: encounter.attributes.timestamp,
                publishedAt: encounter.attributes.publishedAt
              }
            });
            console.log(`    ✅ Created photo-encounter: ${encounter.attributes.slug}`);
          } else {
            console.log(`    ⚠️  Photo-encounter already exists: ${encounter.attributes.slug}`);
          }
        } catch (error) {
          console.log(`    ❌ Photo-encounter ${encounter.attributes.slug}: ${error.message}`);
        }
      }
    }
    
    // Step 4: Import contacts (independent content)
    if (data.contacts && data.contacts.length > 0) {
      console.log('  📤 Importing contacts...');
      for (const contact of data.contacts) {
        try {
          // Create contact without checking for duplicates since contacts can legitimately be duplicated
          await app.db.query('api::contact.contact').create({
            data: {
              phone: contact.attributes.phone,
              email: contact.attributes.email,
              instagram: contact.attributes.instagram,
              smsOptOut: contact.attributes.smsOptOut,
              publishedAt: contact.attributes.publishedAt
            }
          });
          console.log(`    ✅ Created contact: ${contact.attributes.email || contact.attributes.phone || contact.id}`);
        } catch (error) {
          console.log(`    ❌ Contact ${contact.id}: ${error.message}`);
        }
      }
    }
    
    // Step 5: Get local writers and categories for mapping
    console.log('  🔗 Getting local references for articles...');
    const localWriters = await app.db.query('api::writer.writer').findMany();
    const localCategories = await app.db.query('api::category.category').findMany();
    
    const writerMap = {};
    localWriters.forEach(writer => {
      writerMap[writer.name] = writer.id;
    });
    
    const categoryMap = {};
    localCategories.forEach(category => {
      categoryMap[category.slug] = category.id;
    });
    
    // Step 6: Import articles with proper relations
    if (data.articles && data.articles.length > 0) {
      console.log('  📤 Importing articles...');
      for (const article of data.articles) {
        try {
          const existing = await app.db.query('api::article.article').findOne({
            where: { slug: article.attributes.slug }
          });
          
          if (existing) {
            console.log(`    ⚠️  Article already exists: ${article.attributes.title}`);
            continue;
          }
          
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
            listed: article.attributes.listed !== undefined ? article.attributes.listed : true,
            publishedAt: article.attributes.publishedAt,
            author: authorId
          };
          
          const createdArticle = await app.db.query('api::article.article').create({
            data: articleData
          });
          
          // Connect categories
          if (categoryIds.length > 0) {
            await app.db.query('api::article.article').update({
              where: { id: createdArticle.id },
              data: {
                categories: categoryIds
              }
            });
          }
          
          console.log(`    ✅ Created article: ${article.attributes.title}`);
        } catch (error) {
          console.log(`    ❌ Article ${article.attributes.title}: ${error.message}`);
        }
      }
    }
    
    // Step 7: Import global settings (single-type)
    if (data.global) {
      console.log('  📤 Importing global settings...');
      try {
        await app.db.query('api::global.global').update({
          where: { id: 1 },
          data: data.global.attributes
        });
        console.log('    ✅ Updated global settings');
      } catch (error) {
        try {
          // If update fails, try creating
          await app.db.query('api::global.global').create({
            data: data.global.attributes
          });
          console.log('    ✅ Created global settings');
        } catch (createError) {
          console.log(`    ❌ Global settings: ${createError.message}`);
        }
      }
    }
    
    // Step 8: Import homepage (single-type)
    if (data.homepage) {
      console.log('  📤 Importing homepage...');
      try {
        await app.db.query('api::homepage.homepage').update({
          where: { id: 1 },
          data: data.homepage.attributes
        });
        console.log('    ✅ Updated homepage');
      } catch (error) {
        try {
          // If update fails, try creating
          await app.db.query('api::homepage.homepage').create({
            data: data.homepage.attributes
          });
          console.log('    ✅ Created homepage');
        } catch (createError) {
          console.log(`    ❌ Homepage: ${createError.message}`);
        }
      }
    }
    
    console.log('🎉 Full import completed!');
    console.log('📊 Summary:');
    console.log(`   Writers: ${data.writers?.length || 0}`);
    console.log(`   Categories: ${data.categories?.length || 0}`);
    console.log(`   Articles: ${data.articles?.length || 0}`);
    console.log(`   Photo Encounters: ${data['photo-encounters']?.length || 0}`);
    console.log(`   Contacts: ${data.contacts?.length || 0}`);
    console.log(`   Global: ${data.global ? '✅' : '❌'}`);
    console.log(`   Homepage: ${data.homepage ? '✅' : '❌'}`);
    
    await app.destroy();
    
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
    console.log('Usage: node database-sync.js [export|import|sync]');
    console.log('  export - Export all data from production');
    console.log('  import - Import all data to local');
    console.log('  sync   - Export then import (default)');
  }
}

main().catch(console.error);