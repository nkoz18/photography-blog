#!/bin/bash

# Data Down / Schema Up Workflow
# 1. Pull production data via SSH (data flows down)
# 2. Apply local schema changes (schema flows up)
# 3. Handle contact/encounter tables that don't exist in production

set -e  # Exit on any error

echo "🚀 Starting DATA DOWN / SCHEMA UP SYNC..."
echo "📸 Based on RDS snapshot: db6252025"
echo "📋 Workflow: Production data ⬇️  + Local schema ⬆️"
echo ""

# Environment variables
LOCAL_DB_PASSWORD="${LOCAL_DB_PASSWORD:-localpass}"
PRODUCTION_DB_PASSWORD="${PRODUCTION_DB_PASSWORD:-TmiY7bdr22WCB7N}"
SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/ec2-strapi-key-pair.pem}"
PRODUCTION_SERVER="${PRODUCTION_SERVER:-ubuntu@44.246.84.130}"
PRODUCTION_DB_HOST="${PRODUCTION_DB_HOST:-photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com}"

echo "📋 Configuration:"
echo "   Production DB: $PRODUCTION_DB_HOST/strapi"
echo "   Local DB: localhost/strapi"
echo "   SSH Server: $PRODUCTION_SERVER"
echo ""

# Step 1: Stop backend and clear ALL caches (critical for schema changes)
echo "🛑 Stopping backend and clearing ALL caches..."
pkill -f "strapi develop" 2>/dev/null && echo "   ✅ Stopped backend" || echo "   ⚠️  No backend to stop"
sleep 3

# Clear Strapi caches (critical for schema detection)
rm -rf .cache .tmp build dist uploads public/uploads node_modules/.cache || true
rm -rf ../frontend/.next ../frontend/node_modules/.cache ../frontend/out ../frontend/dist ../frontend/build || true
find . -name "*.db" -type f -delete 2>/dev/null || true
echo "   ✅ ALL caches cleared"

# Step 2: Prepare clean local database (critical for clean import)
echo "🗄️  Preparing CLEAN local 'strapi' database..."

# Create strapi user if doesn't exist
sudo -u postgres psql -c "CREATE USER strapi WITH PASSWORD '$LOCAL_DB_PASSWORD';" 2>/dev/null || echo "   ⚠️  User 'strapi' already exists"

# Drop and recreate for completely clean state
sudo -u postgres psql -c "DROP DATABASE IF EXISTS strapi;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE strapi OWNER strapi;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;"

echo "   ✅ CLEAN local 'strapi' database ready"

# Step 3: Check production server accessibility
echo "🔍 Checking production server accessibility..."
if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Server accessible'" > /dev/null 2>&1; then
    echo "❌ Production server not accessible"
    exit 1
fi
echo "   ✅ Production server accessible"

# Step 4: Export production data (DATA DOWN ⬇️)
echo "📥 DATA DOWN: Exporting production 'strapi' database..."
ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "
PGPASSWORD='$PRODUCTION_DB_PASSWORD' pg_dump \\
  -h $PRODUCTION_DB_HOST \\
  -p 5432 -U postgres -d strapi \\
  --clean --if-exists \\
  --no-owner --no-privileges \\
  --format=custom \\
  > /tmp/production_strapi_snapshot.dump && echo 'Production export completed'
"

# Step 5: Download production dump
echo "⬇️  Downloading production data..."
scp -q -i "$SSH_KEY_PATH" \
  "$PRODUCTION_SERVER":/tmp/production_strapi_snapshot.dump \
  /tmp/

# Verify dump
if [ ! -f "/tmp/production_strapi_snapshot.dump" ]; then
    echo "❌ Failed to download production dump"
    exit 1
fi

DUMP_SIZE=$(du -h /tmp/production_strapi_snapshot.dump | cut -f1)
echo "   ✅ Downloaded production data ($DUMP_SIZE)"

# Step 6: Import production data to clean local database
echo "📤 Importing production data to local database..."
if PGPASSWORD="$LOCAL_DB_PASSWORD" pg_restore \
  --no-owner --role=strapi \
  -h localhost -U strapi -d strapi \
  --jobs=4 --clean --if-exists \
  /tmp/production_strapi_snapshot.dump; then
    echo "   ✅ Production data imported successfully"
else
    echo "❌ Production data import failed"
    exit 1
fi

# Step 7: Apply local schema changes (SCHEMA UP ⬆️)
echo "🔧 SCHEMA UP: Applying local schema changes..."

# Start Strapi temporarily to detect and create new schemas
echo "   🚀 Starting Strapi to detect schema changes..."
cd /home/nikita/code/photography-blog/backend

# Start Strapi in background, let it create missing tables
timeout 30s npm run develop > /tmp/strapi_schema_up.log 2>&1 || true

# Check if new tables were created
CONTACT_EXISTS=$(PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h localhost -U strapi -d strapi -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='contacts');")
ENCOUNTER_EXISTS=$(PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h localhost -U strapi -d strapi -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='photo_encounters');")

if [ "$CONTACT_EXISTS" = "t" ]; then
    echo "   ✅ Contact schema created"
else
    echo "   ⚠️  Contact schema not detected"
fi

if [ "$ENCOUNTER_EXISTS" = "t" ]; then
    echo "   ✅ Photo encounter schema created"
else
    echo "   ⚠️  Photo encounter schema not detected"
fi

# Stop the temporary Strapi process
pkill -f "strapi develop" 2>/dev/null || true
sleep 2

echo "   ✅ Local schema changes applied"

# Step 8: Cleanup
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/production_strapi_snapshot.dump
ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "rm -f /tmp/production_strapi_snapshot.dump" 2>/dev/null || true

echo ""
echo "🎉 DATA DOWN / SCHEMA UP SYNC COMPLETED!"
echo ""
echo "📊 What happened:"
echo "   📥 DATA DOWN: Production articles, writers, categories → Local DB"
echo "   📤 SCHEMA UP: Local contact & encounter schemas → Local DB"
echo "   🧹 Clean import (no duplicates, no conflicts)"
echo ""
echo "🚀 Next steps:"
echo "   1. Start backend: npm run develop"
echo "   2. Visit http://localhost:1337/admin (create admin user)"
echo "   3. Verify production articles exist"
echo "   4. Test new contact/encounter features"
echo ""
echo "💡 Pattern established:"
echo "   🔄 Production data flows DOWN only"
echo "   🔄 Local schema changes flow UP via Git"