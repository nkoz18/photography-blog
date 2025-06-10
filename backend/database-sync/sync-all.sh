#!/bin/bash

# Full Production-to-Local Database Sync Script
# Run from the backend directory: bash database-sync/sync-all.sh

echo "🔄 Starting full production-to-local database sync..."
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: This script must be run from the backend directory"
    echo "   cd backend && bash database-sync/sync-all.sh"
    exit 1
fi

# Check if local Strapi is running
if ! curl -s http://localhost:1337/admin > /dev/null; then
    echo "❌ Error: Local Strapi is not running"
    echo "   Please start it with: npm run develop"
    exit 1
fi

echo "✅ Local Strapi is running"
echo ""

# Step 1: Configure permissions
echo "📝 Step 1/5: Configuring API permissions..."
node database-sync/main-workflow/configure-permissions.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to configure permissions"
    exit 1
fi
echo ""

# Step 2: Sync content
echo "📥 Step 2/5: Syncing content from production..."
node database-sync/main-workflow/full-sync.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to sync content"
    exit 1
fi
echo ""

# Step 3: Sync main images
echo "🖼️  Step 3/5: Setting up main article images..."
node database-sync/main-workflow/simple-image-update.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to sync main images"
    exit 1
fi
echo ""

# Step 4: Sync gallery images
echo "🎨 Step 4/5: Setting up gallery images (this may take a few minutes)..."
node database-sync/main-workflow/sync-gallery-images.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to sync gallery images"
    exit 1
fi
echo ""

# Step 5: Cleanup permissions
echo "🔒 Step 5/5: Securing API permissions..."
node database-sync/main-workflow/cleanup-permissions.js
if [ $? -ne 0 ]; then
    echo "❌ Failed to cleanup permissions"
    exit 1
fi
echo ""

echo "✅ Full sync completed successfully!"
echo ""
echo "📊 Sync Summary:"
echo "   - Content synced from https://api.silkytruth.com"
echo "   - Images configured to use local proxy"
echo "   - API permissions secured"
echo ""
echo "🚀 You can now start frontend development with:"
echo "   cd ../frontend"
echo "   NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev"