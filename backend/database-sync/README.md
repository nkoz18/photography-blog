# Database Sync Scripts

## Current Production Script

### ✅ `improved-data-down-schema-up.sh`
**Production-ready "data down / schema up" workflow**

**What it does:**
- ⬇️ **Data Down**: Exports production database via SSH and imports to clean local database
- ⬆️ **Schema Up**: Starts Strapi to detect and apply local schema changes (contacts, encounters)
- 🧹 **Clean Process**: Stops servers, clears all caches, creates fresh database
- 🔐 **Secure**: Uses environment variables, no hardcoded credentials
- 📊 **Reliable**: Pre-flight checks, error handling, comprehensive logging

**Features:**
- Dry-run mode (`--dry-run`)
- Custom snapshot ID (`--snapshot-id`)
- Comprehensive pre-flight validation
- Passwordless sudo requirements check
- SSH and RDS connectivity verification
- Complete cache clearing (Strapi + Next.js)
- Clean database import with no duplicates
- Schema migration detection and verification

## Usage

```bash
# Set up environment (see PRE-RUN-CHECKLIST.md)
export LOCAL_DB_PASSWORD="your_local_password"
export PRODUCTION_DB_PASSWORD="your_production_password"
export SSH_KEY_PATH="~/.ssh/ec2-strapi-key-pair.pem"
export PRODUCTION_SERVER="ubuntu@your.server.ip"
export PRODUCTION_DB_HOST="your-db.region.rds.amazonaws.com"

# Run the sync
cd backend/database-sync
./improved-data-down-schema-up.sh

# Options
./improved-data-down-schema-up.sh --dry-run                    # Test without changes
./improved-data-down-schema-up.sh --snapshot-id db6252025      # Use specific snapshot
```

## Before Running

1. **Read the checklist**: `PRE-RUN-CHECKLIST.md`
2. **Set environment variables**: See `.env.sync-template`
3. **Ensure passwordless sudo**: `sudo visudo` to add postgres permissions
4. **Test SSH access**: Verify key and server connectivity

## Pattern: Data Down / Schema Up

- **Schema lives in Git** - commit content-type changes, never edit schema on prod
- **Data flows down only** - production is single source of content
- **Clean imports** - always wipe local DB first to avoid conflicts
- **Local schema migrations** - new tables created after data import