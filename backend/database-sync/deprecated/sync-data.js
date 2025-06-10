const axios = require('axios');
const fs = require('fs');

const PRODUCTION_API = 'https://api.silkytruth.com';
const LOCAL_API = 'http://localhost:1337';

async function exportData() {
  console.log('🔄 Exporting data from production...');
  
  try {
    // Export content types
    const contentTypes = ['articles', 'categories', 'writers', 'global', 'homepage'];
    const exportData = {};
    
    for (const contentType of contentTypes) {
      console.log(`  📥 Fetching ${contentType}...`);
      
      try {
        const response = await axios.get(`${PRODUCTION_API}/api/${contentType}`, {
          params: {
            populate: '*'
          }
        });
        
        if (contentType === 'global' || contentType === 'homepage') {
          exportData[contentType] = response.data.data;
        } else {
          exportData[contentType] = response.data.data || [];
        }
        
        console.log(`  ✅ ${contentType}: ${Array.isArray(exportData[contentType]) ? exportData[contentType].length + ' items' : 'single item'}`);
      } catch (error) {
        console.log(`  ⚠️  ${contentType}: Not found or error - ${error.response?.status || error.message}`);
        exportData[contentType] = null;
      }
    }
    
    // Save to file
    fs.writeFileSync('/tmp/strapi_export.json', JSON.stringify(exportData, null, 2));
    console.log('✅ Export completed: /tmp/strapi_export.json');
    
    return exportData;
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    throw error;
  }
}

async function importData() {
  console.log('🔄 Importing data to local database...');
  
  try {
    const data = JSON.parse(fs.readFileSync('/tmp/strapi_export.json', 'utf8'));
    
    // Import writers first (they're referenced by articles)
    if (data.writers && data.writers.length > 0) {
      console.log('  📤 Importing writers...');
      for (const writer of data.writers) {
        try {
          const response = await axios.post(`${LOCAL_API}/api/writers`, {
            data: {
              name: writer.attributes.name,
              email: writer.attributes.email
              // Skip picture relation for now
            }
          });
          console.log(`    ✅ Created writer: ${writer.attributes.name}`);
        } catch (error) {
          console.log(`    ⚠️  Writer ${writer.attributes.name}: ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }
    
    // Import categories
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
    
    // Import global settings (single-type, use PUT)
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
    
    // Import homepage (single-type, use PUT)
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
    
    console.log('✅ Import completed!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  }
}

async function main() {
  const action = process.argv[2];
  
  if (action === 'export') {
    await exportData();
  } else if (action === 'import') {
    await importData();
  } else if (action === 'sync') {
    await exportData();
    await importData();
  } else {
    console.log('Usage: node sync-data.js [export|import|sync]');
    console.log('  export - Export data from production');
    console.log('  import - Import data to local');
    console.log('  sync   - Export then import');
  }
}

main().catch(console.error);