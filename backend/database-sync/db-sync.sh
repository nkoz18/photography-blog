#!/bin/bash

# Simple Database Sync Script
# Exports production PostgreSQL database and imports to local development

set -e  # Exit on any error

echo "🔄 Starting database sync from production..."
echo ""

# Check if EC2 is accessible
echo "🔍 Checking production server accessibility..."
if ! ssh -i ~/.ssh/ec2-strapi-key-pair.pem -o ConnectTimeout=10 ubuntu@44.246.84.130 "echo 'Server accessible'" > /dev/null 2>&1; then
    echo "❌ EC2 server not accessible."
    echo ""
    echo "📋 Use AWS Console method instead:"
    echo "   1. Go to AWS RDS Console"
    echo "   2. Select photography-blog-db"
    echo "   3. Actions → Create snapshot"
    echo "   4. Download or export to S3"
    echo "   5. Import locally with psql"
    echo ""
    echo "📖 See DATABASE_SYNC_GUIDE.md for detailed instructions."
    exit 1
fi

echo "✅ Production server is accessible"
echo ""

# Stop local backend
echo "🛑 Stopping local backend..."
LOCAL_STRAPI_PID=$(ps aux | grep 'strapi develop' | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$LOCAL_STRAPI_PID" ]; then
    kill $LOCAL_STRAPI_PID
    echo "   Stopped process $LOCAL_STRAPI_PID"
    sleep 3
else
    echo "   No local backend process found"
fi

# Export from production
echo "📥 Exporting production database..."
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "
PGPASSWORD='TmiY7bdr22WCB7N' pg_dump \
  -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com \
  -p 5432 -U postgres -d strapi \
  --clean --if-exists \
  --no-owner --no-privileges \
  > /tmp/production_full_db.sql && echo 'Export completed on server'
"

# Download dump
echo "⬇️  Downloading database dump..."
scp -q -i ~/.ssh/ec2-strapi-key-pair.pem \
  ubuntu@44.246.84.130:/tmp/production_full_db.sql \
  /tmp/

# Verify dump file
if [ ! -f "/tmp/production_full_db.sql" ]; then
    echo "❌ Failed to download database dump"
    exit 1
fi

DUMP_SIZE=$(du -h /tmp/production_full_db.sql | cut -f1)
echo "✅ Downloaded database dump ($DUMP_SIZE)"

# Reset local database
echo "🗄️  Resetting local database..."

# Check if PostgreSQL is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS postgres;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO strapi;"
echo "✅ Local database reset complete"

# Import data
echo "📤 Importing production data to local database..."
if PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres -q < /tmp/production_full_db.sql; then
    echo "✅ Database import completed successfully"
else
    echo "❌ Database import failed"
    exit 1
fi

# Start backend
echo "🚀 Starting local backend..."
cd "$(dirname "$0")/.." && nohup npm run develop > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Started backend process $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
for i in {1..30}; do
    if curl -s http://localhost:1337/admin > /dev/null 2>&1; then
        echo "✅ Backend is running"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start after 30 seconds"
        echo "📋 Check backend.log for errors"
        exit 1
    fi
    sleep 1
done

# Cleanup
rm -f /tmp/production_full_db.sql
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "rm -f /tmp/production_full_db.sql" 2>/dev/null || true

echo ""
echo "🎉 Database sync completed successfully!"
echo ""
echo "🎯 Local environment ready:"
echo "   - Backend: http://localhost:1337/admin"
echo "   - API: http://localhost:1337/api"
echo ""
echo "🚀 To start frontend:"
echo "   cd frontend"
echo "   NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev"
echo ""
echo "📊 Synced data includes:"
echo "   - All articles with complete galleries and images"
echo "   - All writers, categories, and content"
echo "   - Image focal points and metadata"
echo "   - User accounts and permissions"
echo "   - Exact production data state"