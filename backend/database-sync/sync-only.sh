#!/bin/bash

# Production Database Sync - Data Only
# Assumes database is already set up, just syncs the data

set -e  # Exit on any error

echo "🚀 Starting PRODUCTION DATA SYNC..."
echo "⚠️  This will replace ALL local data with production data"
echo ""

# Environment variables with defaults
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

# Step 1: Check production server accessibility
echo "🔍 Checking production server accessibility..."
if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Server accessible'" > /dev/null 2>&1; then
    echo "❌ EC2 server not accessible."
    exit 1
fi

echo "   ✅ Production server is accessible"

# Step 2: Export from production
echo "📥 Exporting production 'strapi' database..."
ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "
PGPASSWORD='$PRODUCTION_DB_PASSWORD' pg_dump \\
  -h $PRODUCTION_DB_HOST \\
  -p 5432 -U postgres -d strapi \\
  --clean --if-exists \\
  --no-owner --no-privileges \\
  > /tmp/production_strapi_full.sql && echo 'Export completed on server'
"

# Step 3: Download dump
echo "⬇️  Downloading database dump..."
scp -q -i "$SSH_KEY_PATH" \\
  "$PRODUCTION_SERVER":/tmp/production_strapi_full.sql \\
  /tmp/

# Verify dump file
if [ ! -f "/tmp/production_strapi_full.sql" ]; then
    echo "❌ Failed to download database dump"
    exit 1
fi

DUMP_SIZE=$(du -h /tmp/production_strapi_full.sql | cut -f1)
echo "   ✅ Downloaded database dump ($DUMP_SIZE)"

# Step 4: Import to local strapi database
echo "📤 Importing to local 'strapi' database..."
if PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h localhost -U strapi -d strapi -q < /tmp/production_strapi_full.sql; then
    echo "   ✅ Database import completed successfully"
else
    echo "❌ Database import failed"
    exit 1
fi

# Step 5: Cleanup
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/production_strapi_full.sql
ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "rm -f /tmp/production_strapi_full.sql" 2>/dev/null || true

echo ""
echo "🎉 PRODUCTION DATA SYNC COMPLETED!"
echo ""
echo "📊 Synced from production 'strapi' database:"
echo "   - All articles with galleries and focal points"
echo "   - Writers, categories, and all metadata"
echo "   - Admin users and permissions"
echo "   - Complete production data parity"
echo ""
echo "🔍 Test the Japanese Friendship Garden article for focal points and gallery!"