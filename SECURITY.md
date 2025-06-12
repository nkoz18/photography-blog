# Security Guidelines

## ⚠️ CRITICAL: Credential Management

### Environment Variables Required

**NEVER commit these to Git.** Set them in your local environment:

```bash
# Local Development
export LOCAL_DB_PASSWORD="your_local_postgres_password"
export PRODUCTION_DB_PASSWORD="your_production_postgres_password"

# For database sync scripts
export SSH_KEY_PATH="~/.ssh/ec2-strapi-key-pair.pem"
export PRODUCTION_SERVER="ubuntu@44.246.84.130"
export PRODUCTION_DB_HOST="photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com"
```

### Files That Must Use Environment Variables

- `backend/database-sync/db-sync.sh` ✅ Fixed
- `backend/database-sync/main-workflow/update-urls-to-proxy.js` ✅ Fixed
- All database sync scripts ✅ Fixed

### Secure Database Connection Example

```javascript
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'strapi',
  password: process.env.LOCAL_DB_PASSWORD, // ← Environment variable
});
```

### GitGuardian Alerts

If you receive GitGuardian alerts:

1. **Immediately rotate credentials** in AWS RDS
2. **Update environment variables** locally
3. **Verify no credentials in committed files**
4. **Consider using AWS Secrets Manager** for production

## Best Practices

1. **Never hardcode credentials** in any file
2. **Use .env files** for local development (already in .gitignore)
3. **Use AWS IAM roles** and Secrets Manager for production
4. **Rotate credentials regularly**
5. **Monitor with GitGuardian** for accidental commits

## Emergency Response

If credentials are exposed:
1. Rotate all affected credentials immediately
2. Check AWS CloudTrail for unauthorized access
3. Update all scripts and applications
4. Review Git history for exposure duration