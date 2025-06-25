# Database Sync Scripts

## Current Scripts (Cleaned Up)

### ✅ Recommended: `data-down-schema-up.sh`
**Production-ready "data down / schema up" workflow**
- Pulls production data via SSH (data flows down ⬇️)
- Applies local schema changes (schema flows up ⬆️)
- Handles new contact/encounter tables that don't exist in production
- Clean import with no duplicates or conflicts

### `sync-only.sh`
**Simple data-only sync**
- Assumes database is already set up
- Just syncs production data to local
- No schema changes

### `rds-snapshot-sync.sh` (Experimental)
**Uses RDS snapshot directly**
- Creates temporary RDS instance from snapshot
- More complex but uses latest snapshot data
- Requires AWS permissions for RDS instance creation

### `simple-snapshot-sync.sh` (Incomplete)
**Attempted S3 export approach**
- RDS snapshot → S3 export → Local import
- Note: RDS exports create Parquet files, not SQL dumps
- Needs additional conversion tools

## Usage

```bash
# Recommended workflow
cd backend/database-sync
./data-down-schema-up.sh

# Simple data sync only
./sync-only.sh
```

## Environment Variables Required

```bash
export LOCAL_DB_PASSWORD="localpass"
export PRODUCTION_DB_PASSWORD="your_production_password"
export SSH_KEY_PATH="~/.ssh/ec2-strapi-key-pair.pem"
export PRODUCTION_SERVER="ubuntu@44.246.84.130"
export PRODUCTION_DB_HOST="photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com"
```

## Pattern: Data Down / Schema Up

- **Schema lives in Git** - commit content-type changes, never edit schema on prod
- **Data flows down only** - production is single source of content
- **Clean imports** - always wipe local DB first to avoid conflicts
- **Local schema migrations** - new tables created after data import