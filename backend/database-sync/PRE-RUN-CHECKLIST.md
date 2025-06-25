# Pre-Run Checklist for Database Sync

## Critical Setup Requirements

### 1. Environment Variables
Create `.env.sync` file with your actual values:
```bash
cp .env.sync-template .env.sync
# Edit .env.sync with your actual credentials
```

**Never commit secrets to Git!**

### 2. Passwordless Sudo Setup
```bash
sudo visudo
# Add this line:
your_username ALL=(postgres) NOPASSWD: ALL
```

### 3. AWS Security Group Rules
Verify RDS security group allows:
- **Inbound**: Port 5432 from EC2 security group
- **Outbound**: All traffic (or specific to your local IP)

### 4. Upload Provider Configuration
Add to `.env`:
```bash
# Disable caching in development
CACHE_ENABLED=false

# Upload configuration (choose one):

# Option A: Use production S3 bucket (read-only)
UPLOAD_PROVIDER=aws-s3
AWS_S3_BUCKET=your-production-bucket
AWS_S3_REGION=us-west-2
CLOUDFRONT_DOMAIN=your-cdn-domain.com

# Option B: Local uploads for development
UPLOAD_PROVIDER=local
```

### 5. Database Extensions Check
Run this to see what extensions your production DB uses:
```bash
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "
PGPASSWORD='your_prod_password' psql -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres -d strapi -c \"SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql');\""
```

Common extensions needed:
- `uuid-ossp` (for UUID generation)
- `pgcrypto` (for encryption)
- `unaccent` (for search)

### 6. Backup Current State
```bash
# Backup current local database (if exists)
pg_dump -h localhost -U strapi strapi > /tmp/current-local-backup.sql

# Backup current codebase
git stash push -m "Before database sync $(date)"
```

## Pre-Flight Verification Commands

Run these to verify everything is ready:

```bash
# Test SSH access
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "echo 'SSH works'"

# Test RDS connectivity from EC2
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "pg_isready -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres"

# Test passwordless sudo
sudo -n -u postgres psql -c "SELECT version();"

# Verify snapshot exists
aws rds describe-db-snapshots --db-snapshot-identifier db6252025 --region us-west-2
```

## What the Script Does

### Phase 1: Validation
- Checks all environment variables are set
- Verifies SSH connectivity to EC2
- Tests RDS connectivity from EC2
- Confirms passwordless sudo works

### Phase 2: Clean State
- Stops all Strapi processes
- Clears ALL caches (critical for schema detection)
- Drops and recreates local database completely

### Phase 3: Data Import
- Exports production database via SSH + pg_dump
- Downloads dump file to local machine
- Imports production data with parallel jobs

### Phase 4: Schema Migration  
- Starts Strapi in development mode
- Auto-detects missing schemas (contacts, encounters)
- Creates new tables and relationships
- Verifies schema creation succeeded

### Phase 5: Cleanup
- Removes temporary files
- Provides verification steps

## Rollback Plan

If sync fails:
```bash
# Restore previous local database
psql -h localhost -U strapi strapi < /tmp/current-local-backup.sql

# Restore codebase
git stash pop
```

## Long-term Improvements Needed

1. **Migration System**: Replace auto-sync with proper migration files
2. **Secrets Management**: Use AWS SSM or HashiCorp Vault
3. **CI/CD Integration**: Add dry-run mode for automated testing
4. **Extension Management**: Automate extension installation
5. **Health Checks**: Add post-sync verification endpoints