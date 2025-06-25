# Database Syncing Log

## Task Overview
Fix database sync issues where Japanese Friendship Garden article was missing focal point and gallery data after sync. Ensure local database exactly matches production with proper database export/import approach.

## Critical Database Configuration Discovery

### Production Database Configuration
- **Host**: photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com (AWS RDS)
- **Database Name**: `strapi` (confirmed production database name)
- **User**: `postgres`
- **Port**: 5432

### Local Database Configuration Issues Found
- **Original Setup**: Local Strapi was using SQLite database (.tmp/data.db)
- **Expected Setup**: Should use PostgreSQL to match production
- **Database Name Confusion**: Local PostgreSQL has database named `postgres` but production uses `strapi`
- **Key Issue**: Schema mismatch between production (`strapi` database) and local (`postgres` database)

### Timeline and Findings

#### Initial Problem (User Report)
- **Issue**: Japanese Friendship Garden article missing focal point for cover image
- **Issue**: Gallery completely missing from Japanese Garden article  
- **Issue**: Frontend showing "Cannot destructure property 'components' of 'object null'" errors
- **Issue**: Backend showing "ENOENT: no such file or directory, open '/home/nikita/code/photography-blog/backend/build/index.html'"

#### Root Causes Identified
1. **Database Name Mismatch**: Production uses `strapi` database, local uses `postgres` database
2. **Missing Build Files**: Backend build directory missing after cache clear
3. **Demo Data Loading**: Bootstrap.js loading demo data into SQLite instead of PostgreSQL
4. **Schema Mismatch**: Local schema changes vs production schema causing import failures

## Current System State (BROKEN)
- **Backend Status**: Running but missing build files, serving errors
- **Frontend Status**: Running but getting null component data, cannot render pages
- **Database Status**: **CRITICAL ISSUE FOUND** - Configuration mismatch!
- **Data Status**: No production data, possibly demo data or empty database

## CRITICAL CONFIGURATION MISMATCH DISCOVERED

### The Problem
**LOCAL CONFIGURATION CONFLICT**:
- `backend/config/database.js` lines 5-14: Forces SQLite in development mode
- `backend/.env` lines 9-14: Configures PostgreSQL with database name `postgres`
- **Result**: Strapi ignores .env PostgreSQL config and uses SQLite instead!

### Current Configuration Analysis
```javascript
// database.js - FORCES SQLite in development
if (env('NODE_ENV') === 'development') {
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: path.join(__dirname, '..', '.tmp', 'data.db'),
      },
    },
  };
}
```

```bash
# .env - PostgreSQL config (IGNORED due to database.js)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=postgres  # ← Should be 'strapi' to match production
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=localpass
```

### Production vs Local Database Names
- **Production**: Database name = `strapi`
- **Local .env**: Database name = `postgres` 
- **Actual Local**: Using SQLite file, not PostgreSQL at all!

## Required Actions for Fix

### 1. Database Configuration Standardization
Need to ensure:
- Local PostgreSQL database named `strapi` (matching production)
- All connections point to PostgreSQL, not SQLite
- Clear database configuration documentation

### 2. Complete Database Export/Import Process
- Export entire `strapi` database from production
- Import into local `strapi` database (create if needed)
- Preserve schema and all data including focal points, galleries, writers

### 3. Fix Backend Build Issues
- Rebuild Strapi admin interface
- Ensure all build files present

### 4. Fix Frontend Component Issues
- Ensure frontend connects to correct database
- Verify API responses include proper component data

## Database Export/Import Commands (To Implement)

### Production Export
```bash
# On production server or via SSH
PGPASSWORD='$PRODUCTION_DB_PASSWORD' pg_dump \
  -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com \
  -p 5432 -U postgres -d strapi \
  --clean --if-exists \
  --no-owner --no-privileges \
  > production_strapi_full.sql
```

### Local Import
```bash
# Create strapi database if it doesn't exist
sudo -u postgres createdb strapi

# Import production dump
PGPASSWORD='$LOCAL_DB_PASSWORD' psql \
  -h localhost -U strapi -d strapi \
  < production_strapi_full.sql
```

## Environment Variables Required
```bash
export LOCAL_DB_PASSWORD="localpass"
export PRODUCTION_DB_PASSWORD="TmiY7bdr22WCB7N"
export SSH_KEY_PATH="~/.ssh/ec2-strapi-key-pair.pem"
export PRODUCTION_SERVER="ubuntu@44.246.84.130"
export PRODUCTION_DB_HOST="photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com"
```

## Expected Outcome After Fix
- Japanese Friendship Garden article with proper focal point
- Gallery displaying correctly with all images
- All production articles present locally
- Backend admin interface working
- Frontend rendering without component errors
- Database name consistency (strapi database on both production and local)

## SOLUTION IMPLEMENTED

### 1. Fixed Database Configuration
- **Modified**: `backend/config/database.js` - Removed SQLite force, now uses PostgreSQL always
- **Modified**: `backend/.env` - Changed DATABASE_NAME from `postgres` to `strapi`
- **Created**: `backend/database-sync/production-database-sync.sh` - Complete sync script

### 2. Database Cleanup Required
**Eliminate unused 'postgres' database and all references:**

#### Commands to run as superuser:
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# List all databases to confirm what exists
\l

# Drop the unused 'postgres' database (if it contains no important data)
DROP DATABASE IF EXISTS postgres;

# Exit PostgreSQL
\q
```

#### Verification commands:
```bash
# Verify only 'strapi' database exists for this project
sudo -u postgres psql -c "\l" | grep -E "(strapi|postgres)"

# Test connection to strapi database
PGPASSWORD=localpass psql -h localhost -U strapi -d strapi -c "SELECT current_database();"
```

### 3. Run Database Sync
```bash
cd backend
bash database-sync/production-database-sync.sh
```

## Expected Final State
- **Local Database**: Only `strapi` database exists
- **Configuration**: All references point to `strapi` database
- **Data**: Complete production data with focal points and galleries
- **No Confusion**: Single source of truth for database name