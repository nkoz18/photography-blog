# Database Sync Scripts

This directory contains scripts for syncing data between production and local development environments.

## ⚠️ IMPORTANT: Use Database Export/Import (Recommended)

The API-based sync scripts have several issues:
- Gallery images don't sync properly
- Focal points are lost (stored in provider_metadata)
- Writers get duplicated on each run
- Complex component relationships break

**Instead, use direct database export/import for 100% identical data.**

## Quick Start - Database Sync (Recommended)

```bash
cd backend
bash database-sync/db-sync.sh
```

This script:
1. Exports the entire production PostgreSQL database
2. Replaces your local database completely
3. Preserves ALL data: galleries, focal points, relationships
4. No duplicates or partial syncs

See [DATABASE_SYNC_GUIDE.md](DATABASE_SYNC_GUIDE.md) for detailed instructions.

## Prerequisites

1. **Local PostgreSQL Database**
   ```bash
   # Install PostgreSQL if not already installed
   sudo apt install postgresql postgresql-contrib
   
   # Create local database user
   sudo -u postgres psql -c "CREATE USER strapi WITH PASSWORD 'localpass';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO strapi;"
   ```

2. **Backend Environment Configuration**
   Update `backend/.env` with local PostgreSQL settings:
   ```env
   DATABASE_CLIENT=postgres
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=postgres
   DATABASE_USERNAME=strapi
   DATABASE_PASSWORD=localpass
   ```

3. **SSH Access** (for automatic sync)
   - EC2 key at: `~/.ssh/ec2-strapi-key-pair.pem`
   - Production server: `ubuntu@44.246.84.130`

## Fallback - API-Based Sync (Deprecated)

⚠️ **Not recommended** - Use only if database sync is not possible:

```bash
# 1. Enable API permissions for import
node database-sync/main-workflow/configure-permissions.js

# 2. Sync all content from production
node database-sync/main-workflow/full-sync.js

# 3. Set up main article images with proxy
node database-sync/main-workflow/simple-image-update.js

# 4. Set up gallery images (may take a few minutes)
node database-sync/main-workflow/sync-gallery-images.js

# 5. Secure the API
node database-sync/main-workflow/cleanup-permissions.js

# 6. (Optional) Verify image setup
node database-sync/utilities/check-images.js
```

## Directory Structure

### main-workflow/
Essential scripts for production-to-local sync:

- **configure-permissions.js** - Temporarily enables public API access for data import
- **full-sync.js** - Exports and imports all content with proper relation mapping
- **simple-image-update.js** - Creates local proxy URLs for main article images
- **sync-gallery-images.js** - Syncs gallery images for articles with photo galleries
- **cleanup-permissions.js** - Removes temporary API permissions after sync

### utilities/
Helper scripts for specific tasks:

- **check-images.js** - Diagnostic tool to inspect current image URLs
- **fix-authors.js** - Assigns missing authors to articles
- **fix-proxy-urls.js** - Bulk updates S3 URLs to proxy URLs

### deprecated/
Legacy or experimental scripts (not recommended for use):

- **sync-data.js** - Legacy sync that excludes articles
- **import-data.js** - Alternative import using internal API
- **sync-all-images.js** - Incomplete alternative to image sync
- **sync-images-with-proxy.js** - Broken experimental approach
- **update-image-urls.js** - For different S3 bucket migration

## Manual Database Sync (Alternative Method)

For a complete database clone including user accounts:

```bash
# 1. Export production database
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130
PGPASSWORD='TmiY7bdr22WCB7N' pg_dump -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres -d strapi --clean --if-exists > /tmp/production_db_backup.sql

# 2. Transfer to local
scp -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130:/tmp/production_db_backup.sql /tmp/

# 3. Import to local PostgreSQL
PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres < /tmp/production_db_backup.sql

# 4. Run image proxy setup
node database-sync/main-workflow/simple-image-update.js
node database-sync/main-workflow/sync-gallery-images.js
```

## How It Works

### Content Sync
The full-sync.js script:
1. Exports all content types from production API (https://api.silkytruth.com)
2. Saves to `/tmp/production_full_export.json`
3. Imports content to local Strapi, properly mapping relationships
4. Handles single-type content (global, homepage) with PUT requests

### Image Proxy System
Since production images are stored in S3, the local environment uses a proxy:
1. Image proxy endpoint: `/api/image-proxy/[filename]`
2. Proxy fetches from S3: `https://photography-blog-images.s3.us-west-2.amazonaws.com/`
3. Local file records point to proxy URLs instead of S3

### Production Content (as of last sync)
- **Articles**: 3 (Oregon Country Fair 2024, Basswitch 6, Basswitch 7)
- **Categories**: 5 (food, nature, news, story, tech)
- **Writers**: 2 (David Doe, Sarah Baker)
- **Gallery Images**: ~200 (mostly in Oregon Country Fair article)

## Troubleshooting

### Sync Fails with 403/401 Errors
Run `configure-permissions.js` before syncing to enable API access.

### Images Not Showing
1. Ensure backend is running at http://localhost:1337
2. Run image sync scripts after content sync
3. Check image URLs with `check-images.js`

### Database Connection Issues
1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check credentials in `.env` match your local setup
3. Ensure database exists: `sudo -u postgres psql -l`

### Missing Authors
Run `fix-authors.js` to assign Nikita Kozlov to articles without authors.

## Notes

- Images are served via proxy, not downloaded locally
- Sync process preserves all content relationships
- Production database uses PostgreSQL on AWS RDS
- Local development should use PostgreSQL to match production