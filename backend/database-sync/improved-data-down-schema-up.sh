#!/bin/bash

# Improved Data Down / Schema Up Workflow
# Addresses security, configuration, and reliability concerns

set -e  # Exit on any error

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/db-sync-$(date +%Y%m%d-%H%M%S).log"
DRY_RUN=false
SNAPSHOT_ID="${SNAPSHOT_ID:-db6252025}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --snapshot-id)
            SNAPSHOT_ID="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [--dry-run] [--snapshot-id SNAPSHOT_ID]"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Dry run execution
execute() {
    if [ "$DRY_RUN" = true ]; then
        log "[DRY-RUN] Would execute: $*"
    else
        log "Executing: $*"
        "$@"
    fi
}

log "🚀 Starting IMPROVED DATA DOWN / SCHEMA UP SYNC..."
log "📸 Using snapshot: $SNAPSHOT_ID"
log "📋 Log file: $LOG_FILE"
if [ "$DRY_RUN" = true ]; then
    log "🔍 DRY RUN MODE - No changes will be made"
fi
echo ""

# Environment variable validation (no defaults for secrets)
: "${LOCAL_DB_PASSWORD:?Need LOCAL_DB_PASSWORD in environment}"
: "${PRODUCTION_DB_PASSWORD:?Need PRODUCTION_DB_PASSWORD in environment}"
: "${SSH_KEY_PATH:?Need SSH_KEY_PATH in environment}"
: "${PRODUCTION_SERVER:?Need PRODUCTION_SERVER in environment}"
: "${PRODUCTION_DB_HOST:?Need PRODUCTION_DB_HOST in environment}"

# Try to load from AWS credentials if available
if [ -f ~/.aws/credentials ] && command -v aws >/dev/null 2>&1; then
    log "📋 AWS credentials file found"
    # Could potentially load RDS password from AWS SSM here
fi

log "📋 Configuration:"
log "   Production DB: $PRODUCTION_DB_HOST/strapi"
log "   Local DB: localhost/strapi"
log "   SSH Server: $PRODUCTION_SERVER"
log "   Snapshot ID: $SNAPSHOT_ID"
echo ""

# Pre-flight checks
log "🔍 Running pre-flight checks..."

# Check passwordless sudo
if ! sudo -n true 2>/dev/null; then
    log "❌ This script needs password-less sudo for the postgres user"
    log "   Run: sudo visudo"
    log "   Add: $USER ALL=(postgres) NOPASSWD: ALL"
    exit 1
fi
log "   ✅ Passwordless sudo available"

# Check SSH key
if [ ! -f "$SSH_KEY_PATH" ]; then
    log "❌ SSH key not found: $SSH_KEY_PATH"
    exit 1
fi
log "   ✅ SSH key found"

# Check production server accessibility
if ! ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 "$PRODUCTION_SERVER" "echo 'Server accessible'" >/dev/null 2>&1; then
    log "❌ Production server not accessible"
    exit 1
fi
log "   ✅ Production server accessible"

# Check RDS connectivity (from EC2)
RDS_ACCESSIBLE=$(ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "
timeout 10 pg_isready -h $PRODUCTION_DB_HOST -p 5432 -U postgres >/dev/null 2>&1 && echo 'true' || echo 'false'
")
if [ "$RDS_ACCESSIBLE" != "true" ]; then
    log "❌ RDS not accessible from EC2 instance"
    log "   Check security group rules for port 5432"
    exit 1
fi
log "   ✅ RDS accessible from production server"

# Verify master user (not just 'postgres' role)
MASTER_USER=$(ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "
aws rds describe-db-instances --db-instance-identifier photography-blog-db --query 'DBInstances[0].MasterUsername' --output text --region us-west-2 2>/dev/null || echo 'postgres'
")
log "   ✅ RDS master user: $MASTER_USER"

# Step 1: Stop backend and clear ALL caches
log "🛑 Stopping backend and clearing ALL caches..."

# Better process management
if [ -f .strapi-dev.pid ]; then
    execute kill "$(cat .strapi-dev.pid)" || true
    execute rm -f .strapi-dev.pid
fi
execute pkill -f "strapi develop" 2>/dev/null || true
execute sleep 3

# Comprehensive cache clearing (preserve directory structure for uploads)
execute rm -rf .cache .tmp build dist node_modules/.cache || true
execute rm -rf public/uploads/* 2>/dev/null || true
execute mkdir -p public/uploads
execute rm -rf ../frontend/.next ../frontend/node_modules/.cache ../frontend/out ../frontend/dist ../frontend/build || true
execute find . -name "*.db" -type f -delete 2>/dev/null || true

log "   ✅ ALL caches cleared"

# Step 2: Check .env configuration for uploads
log "🔧 Checking upload provider configuration..."

if [ -f .env.development ]; then
    UPLOAD_PROVIDER=$(grep "^UPLOAD_PROVIDER=" .env.development | cut -d'=' -f2 | tr -d '"' || echo "not-set")
    log "   Upload provider: $UPLOAD_PROVIDER"
    
    if [ "$UPLOAD_PROVIDER" = "aws-s3" ]; then
        S3_BUCKET=$(grep "^AWS_S3_BUCKET=" .env.development | cut -d'=' -f2 | tr -d '"' || echo "not-set")
        log "   S3 bucket: $S3_BUCKET"
    fi
else
    log "   ⚠️  No .env.development found"
fi

# Disable caching in development
if [ -f .env.development ]; then
    if ! grep -q "CACHE_ENABLED=false" .env.development; then
        execute echo "CACHE_ENABLED=false" >> .env.development
        log "   ✅ Caching disabled in development"
    fi
fi

# Step 3: Prepare clean local database
log "🗄️  Preparing CLEAN local 'strapi' database..."

# Use CREATE ROLE IF NOT EXISTS for PostgreSQL 15+
PG_VERSION=$(sudo -u postgres psql -tAc "SELECT version();" | grep -oP 'PostgreSQL \K[0-9]+' || echo "14")
if [ "$PG_VERSION" -ge 15 ]; then
    execute sudo -u postgres psql -c "CREATE ROLE strapi WITH LOGIN PASSWORD '$LOCAL_DB_PASSWORD';" 2>/dev/null || log "   ⚠️  Role 'strapi' already exists"
else
    execute sudo -u postgres psql -c "CREATE USER strapi WITH PASSWORD '$LOCAL_DB_PASSWORD';" 2>/dev/null || log "   ⚠️  User 'strapi' already exists"
fi

# Keep backup of current database if it exists
BACKUP_EXISTS=$(sudo -u postgres psql -tAc "SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname='strapi');" 2>/dev/null || echo "f")
if [ "$BACKUP_EXISTS" = "t" ] && [ "$DRY_RUN" = false ]; then
    log "   📦 Creating backup of existing database..."
    execute sudo -u postgres pg_dump strapi > "/tmp/strapi-backup-$(date +%Y%m%d-%H%M%S).sql" || true
fi

# Drop and recreate for completely clean state
execute sudo -u postgres psql -c "DROP DATABASE IF EXISTS strapi;" 2>/dev/null || true
execute sudo -u postgres psql -c "CREATE DATABASE strapi OWNER strapi;"
execute sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE strapi TO strapi;"

# Check for required extensions
EXTENSIONS_NEEDED=$(ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "
PGPASSWORD='$PRODUCTION_DB_PASSWORD' psql -h $PRODUCTION_DB_HOST -p 5432 -U $MASTER_USER -d strapi -tAc \"SELECT string_agg(extname, ', ') FROM pg_extension WHERE extname NOT IN ('plpgsql');\" 2>/dev/null || echo 'none'
")
if [ "$EXTENSIONS_NEEDED" != "none" ] && [ -n "$EXTENSIONS_NEEDED" ]; then
    log "   📦 Installing required extensions: $EXTENSIONS_NEEDED"
    for ext in $(echo "$EXTENSIONS_NEEDED" | tr ',' ' '); do
        execute sudo -u postgres psql -d strapi -c "CREATE EXTENSION IF NOT EXISTS $ext;" || log "   ⚠️  Could not install extension: $ext"
    done
fi

log "   ✅ CLEAN local 'strapi' database ready"

# Step 4: Export production data (DATA DOWN ⬇️)
log "📥 DATA DOWN: Exporting production 'strapi' database..."
execute ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "
PGPASSWORD='$PRODUCTION_DB_PASSWORD' pg_dump \\
  -h $PRODUCTION_DB_HOST \\
  -p 5432 -U $MASTER_USER -d strapi \\
  --clean --if-exists \\
  --no-owner --no-privileges \\
  --format=custom \\
  > /tmp/production_strapi_$SNAPSHOT_ID.dump && echo 'Production export completed' || echo 'Export failed'
"

# Step 5: Download production dump
log "⬇️  Downloading production data..."
execute scp -q -i "$SSH_KEY_PATH" \
  "$PRODUCTION_SERVER":/tmp/production_strapi_$SNAPSHOT_ID.dump \
  /tmp/

# Verify dump
if [ ! -f "/tmp/production_strapi_$SNAPSHOT_ID.dump" ] && [ "$DRY_RUN" = false ]; then
    log "❌ Failed to download production dump"
    exit 1
fi

if [ "$DRY_RUN" = false ]; then
    DUMP_SIZE=$(du -h /tmp/production_strapi_$SNAPSHOT_ID.dump | cut -f1)
    log "   ✅ Downloaded production data ($DUMP_SIZE)"
fi

# Step 6: Import production data to clean local database
log "📤 Importing production data to local database..."
if [ "$DRY_RUN" = false ]; then
    if PGPASSWORD="$LOCAL_DB_PASSWORD" pg_restore \
      --no-owner --role=strapi \
      -h localhost -U strapi -d strapi \
      --jobs=4 --clean --if-exists \
      /tmp/production_strapi_$SNAPSHOT_ID.dump 2>&1 | tee -a "$LOG_FILE"; then
        log "   ✅ Production data imported successfully"
    else
        log "❌ Production data import failed - check log: $LOG_FILE"
        exit 1
    fi
fi

# Step 7: Apply local schema changes (SCHEMA UP ⬆️)
log "🔧 SCHEMA UP: Applying local schema changes..."

# Ensure we're in the right directory
cd /home/nikita/code/photography-blog/backend

if [ "$DRY_RUN" = false ]; then
    log "   🚀 Starting Strapi to detect schema changes..."
    
    # Start Strapi with extended timeout and capture PID
    timeout 120s npm run develop > /tmp/strapi_schema_up_$SNAPSHOT_ID.log 2>&1 &
    STRAPI_PID=$!
    echo $STRAPI_PID > .strapi-dev.pid
    
    # Wait for Strapi to complete schema sync
    if wait $STRAPI_PID; then
        log "   ✅ Strapi schema sync completed"
    else
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 124 ]; then
            log "   ⚠️  Strapi schema sync timed out after 120s"
            log "   📋 Check logs: /tmp/strapi_schema_up_$SNAPSHOT_ID.log"
        else
            log "   ❌ Strapi schema sync failed with exit code: $EXIT_CODE"
            log "   📋 Check logs: /tmp/strapi_schema_up_$SNAPSHOT_ID.log"
            exit 1
        fi
    fi
    
    # Clean up PID file
    rm -f .strapi-dev.pid
fi

# Verify new schemas were created
if [ "$DRY_RUN" = false ]; then
    CONTACT_EXISTS=$(PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h localhost -U strapi -d strapi -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='contacts');")
    ENCOUNTER_EXISTS=$(PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h localhost -U strapi -d strapi -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='photo_encounters');")
    
    if [ "$CONTACT_EXISTS" = "t" ]; then
        log "   ✅ Contact schema created"
    else
        log "   ⚠️  Contact schema not detected"
    fi
    
    if [ "$ENCOUNTER_EXISTS" = "t" ]; then
        log "   ✅ Photo encounter schema created"
    else
        log "   ⚠️  Photo encounter schema not detected"
    fi
fi

# Step 8: Post-import URL fixes (if needed)
log "🔧 Checking upload URLs..."
if [ "$DRY_RUN" = false ]; then
    # Check if we need to rewrite URLs for local proxy
    URL_CHECK=$(PGPASSWORD="$LOCAL_DB_PASSWORD" psql -h localhost -U strapi -d strapi -tAc "SELECT url FROM files LIMIT 1;" 2>/dev/null || echo "")
    if [[ "$URL_CHECK" == *"silkytruth.com"* ]]; then
        log "   ✅ URLs point to production CDN (proxy will handle)"
    elif [[ "$URL_CHECK" == *"amazonaws.com"* ]]; then
        log "   ⚠️  URLs point directly to S3 - consider URL rewriting"
    fi
fi

# Step 9: Cleanup
log "🧹 Cleaning up temporary files..."
execute rm -f /tmp/production_strapi_$SNAPSHOT_ID.dump
execute ssh -i "$SSH_KEY_PATH" "$PRODUCTION_SERVER" "rm -f /tmp/production_strapi_$SNAPSHOT_ID.dump" 2>/dev/null || true

log ""
log "🎉 DATA DOWN / SCHEMA UP SYNC COMPLETED!"
log ""
log "📊 What happened:"
log "   📥 DATA DOWN: Production snapshot $SNAPSHOT_ID → Local DB"
log "   📤 SCHEMA UP: Local contact & encounter schemas → Local DB"
log "   🧹 Clean import (no duplicates, no conflicts)"
log ""
log "📋 Log file saved: $LOG_FILE"
log ""
log "🚀 Next steps:"
log "   1. Start backend: npm run develop"
log "   2. Visit http://localhost:1337/admin"
log "   3. Verify production articles exist"
log "   4. Test new contact/encounter features"
log ""
log "💡 Pattern established:"
log "   🔄 Production data flows DOWN only"
log "   🔄 Local schema changes flow UP via Git"

# Idempotency test suggestion
if [ "$DRY_RUN" = false ]; then
    log ""
    log "🔄 Idempotency test: Run this script again to verify it handles re-runs gracefully"
fi