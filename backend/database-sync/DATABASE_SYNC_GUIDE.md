# Simple Database Sync Guide

## Problem with API-Based Sync

The programmatic API sync has several critical issues:
- **Gallery components**: Complex nested relationships aren't preserved
- **Focal points**: Stored in `provider_metadata`, not accessible via API
- **File records**: Media library relationships become corrupted
- **Duplicate prevention**: Writers and other records get duplicated on every sync
- **Complex debugging**: Hard to troubleshoot when sync fails

## Recommended Solution: Direct Database Export/Import + Gallery Sync

This is much simpler, faster, and guarantees 100% identical data. The new `sync-all-galleries.js` script handles any missing gallery data comprehensively.

### Method 1: AWS Console (Recommended)

#### Export from Production
1. Go to AWS RDS Console
2. Select the `photography-blog-db` database
3. Actions → Create snapshot
4. Wait for snapshot to complete
5. Actions → Export to S3 (or download locally)

#### Import to Local
```bash
# Drop local database and recreate
sudo -u postgres psql -c "DROP DATABASE IF EXISTS postgres;"
sudo -u postgres psql -c "CREATE DATABASE postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO strapi;"

# Import the production dump
psql -h localhost -U strapi -d postgres < production_export.sql
```

### Method 2: SSH + pg_dump (When EC2 is accessible)

#### Export from Production
```bash
# SSH into production server
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130

# Create database dump
PGPASSWORD='TmiY7bdr22WCB7N' pg_dump \
  -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com \
  -p 5432 -U postgres -d strapi \
  --clean --if-exists \
  > /tmp/production_full_db.sql

# Exit SSH
exit

# Download dump file
scp -i ~/.ssh/ec2-strapi-key-pair.pem \
  ubuntu@44.246.84.130:/tmp/production_full_db.sql \
  /tmp/
```

#### Import to Local
```bash
# Stop local backend first
ps aux | grep strapi | awk '{print $2}' | xargs kill

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS postgres;"
sudo -u postgres psql -c "CREATE DATABASE postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO strapi;"

# Import production data
PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres < /tmp/production_full_db.sql

# Restart backend
cd backend && nohup npm run develop > ../backend.log 2>&1 &
```

### Method 3: Automated Script (When EC2 is accessible)

```bash
#!/bin/bash
# File: backend/database-sync/db-sync.sh

echo "🔄 Starting database sync from production..."

# Check if EC2 is accessible
if ! ssh -i ~/.ssh/ec2-strapi-key-pair.pem -o ConnectTimeout=10 ubuntu@44.246.84.130 "echo 'Server accessible'" > /dev/null 2>&1; then
    echo "❌ EC2 server not accessible. Use AWS Console method instead."
    echo "See DATABASE_SYNC_GUIDE.md for instructions."
    exit 1
fi

# Stop local backend
echo "🛑 Stopping local backend..."
ps aux | grep strapi | grep -v grep | awk '{print $2}' | xargs kill 2>/dev/null

# Export from production
echo "📥 Exporting production database..."
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "
PGPASSWORD='TmiY7bdr22WCB7N' pg_dump \
  -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com \
  -p 5432 -U postgres -d strapi \
  --clean --if-exists \
  > /tmp/production_full_db.sql
"

# Download dump
echo "⬇️  Downloading database dump..."
scp -i ~/.ssh/ec2-strapi-key-pair.pem \
  ubuntu@44.246.84.130:/tmp/production_full_db.sql \
  /tmp/

# Reset local database
echo "🗄️  Resetting local database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS postgres;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE postgres;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO strapi;"

# Import data
echo "📤 Importing production data..."
PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres < /tmp/production_full_db.sql

# Start backend
echo "🚀 Starting local backend..."
cd backend && nohup npm run develop > ../backend.log 2>&1 &

# Wait for backend to start
sleep 10

if curl -s http://localhost:1337/admin > /dev/null; then
    echo "✅ Database sync completed successfully!"
    echo ""
    echo "🎯 Local environment ready:"
    echo "   - Backend: http://localhost:1337/admin"
    echo "   - Frontend: http://localhost:3000"
    echo ""
    echo "🔍 Start frontend with:"
    echo "   cd frontend && NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev"
else
    echo "❌ Backend failed to start. Check backend.log for errors."
fi
```

## Why This Approach is Better

1. **100% Identical**: Every table, relationship, and metadata is preserved
2. **Includes Everything**: Focal points, file records, user accounts, permissions
3. **No Duplicates**: Fresh database each time, no accumulation of duplicates
4. **Fast**: Single operation instead of complex multi-step API calls
5. **Reliable**: Uses PostgreSQL's native export/import tools
6. **Simple Debugging**: If import fails, it's a database issue, not custom code

## Image Proxy Setup

After database sync, images will work automatically because:
1. All file records are preserved with S3 URLs
2. The image proxy (`/api/image-proxy/*`) serves images from S3
3. No additional sync scripts needed

## Usage

For regular development, use the automated script:
```bash
cd backend
bash database-sync/db-sync.sh
```

When EC2 is down, use AWS Console method with RDS snapshots.

## Troubleshooting

### Local PostgreSQL Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check connections
sudo -u postgres psql -l
```

### Permission Issues
```bash
# Fix database permissions
sudo -u postgres psql -c "ALTER USER strapi CREATEDB;"
sudo -u postgres psql -c "GRANT ALL ON DATABASE postgres TO strapi;"
```

### Import Errors
- Check if local database exists: `sudo -u postgres psql -l`
- Verify credentials in `backend/.env`
- Ensure dump file is valid: `head -20 /tmp/production_full_db.sql`

## Gallery Image Sync (If Needed)

If articles are missing gallery images after database sync, use the comprehensive gallery sync script:

```bash
cd backend
node database-sync/main-workflow/sync-all-galleries.js
```

### What this script does:
- **Dynamically finds all local articles** (no hardcoded IDs)
- **Matches articles by slug** with production data
- **Fetches complete gallery data** from production API
- **Creates image proxy records** for all gallery images  
- **Creates gallery components** with proper image relationships
- **Links galleries to articles** via Strapi component system
- **Skips articles that already have galleries** (safe to re-run)

### Expected output:
```
✅ All articles now have galleries:
   - Oregon Country Fair 🍑 2024: 198 gallery items
   - Basswitch 6: 56 gallery items  
   - Basswitch 7: 42 gallery items
   - Mixtape Meetup: 23 gallery items
   - The One Motorcycle Show 2025: 9 gallery items
   - 🍩 Donuts and Drip 14 💦: 24 gallery items
```

This script resolves the historical sync issues where only one article (OCF) had galleries while others were missing theirs.