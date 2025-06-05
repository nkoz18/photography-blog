# Project Context - Photography Blog

## Current Priority Tasks

### 1. 🔴 CRITICAL: Fix Batch Upload 401 Unauthorized Error
**Status**: In Progress  
**Impact**: Backend deployment is broken - cannot upload images
**Details**: After backend deployment to EC2, batch upload returns 401 error

#### Error Information
```
Error: Request failed with status code 401
Location: Admin panel batch upload feature
Endpoint: POST /api/articles/:id/batch-upload
```

#### Debugging Steps Taken
1. ✅ Verified deployment successful
2. ✅ Admin login works
3. ✅ Individual image uploads work
4. ❌ Batch upload fails with 401

#### System Information
- **EC2 IP**: [NEED VALUE - ask user]
- **EC2 Username**: ec2-user
- **SSH Key Path**: ~/.ssh/[NEED VALUE - ask user for key name]
- **Strapi Directory on EC2**: /home/ec2-user/[NEED VALUE - ask user]
- **Backend URL**: https://api.silkytruth.com
- **Process Manager**: [NEED VALUE - PM2 or systemd?]
- **Node Version on EC2**: [NEED VALUE - check with ssh]

### 2. Frontend Build Warning
**Status**: Not Started  
**Priority**: Medium
**Details**: Legacy peer deps and OpenSSL warnings during build

### 3. Performance Optimization
**Status**: Not Started  
**Priority**: Low
**Details**: Optimize image loading and gallery performance

---

## Project Overview

**Type**: Photography Blog Monorepo  
**Structure**:
- `/backend` - Strapi CMS v4.2.0
- `/frontend` - Next.js v11.0.0 SSG
- Deployed on AWS (EC2 + RDS + S3 + Amplify)

**Key Features**:
- Batch image upload system
- Focal point management for responsive images
- Konami code easter egg
- Dark mode support
- PhotoSwipe galleries

---

## Quick Commands Reference

### Backend Development
```bash
cd backend
npm install
npm run develop      # Dev server at http://localhost:1337/admin
npm run build        # Build admin panel
npm run start        # Production server
```

### Frontend Development
```bash
cd frontend
npm install --legacy-peer-deps

# Local backend (Windows PowerShell)
$env:NODE_OPTIONS="--openssl-legacy-provider"; $env:USE_CLOUD_BACKEND="false"; npm run dev

# Cloud backend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run dev

# Build and deploy
npm run build
npm run export
```

### SSH to Backend
```bash
ssh -i ~/.ssh/[KEY_NAME] ec2-user@[EC2_IP]
cd [STRAPI_DIRECTORY]
```

### Deploy Backend
```bash
# On EC2
./deploy.sh

# Or manually
git pull origin master
npm install
npm run build
[PM2_OR_SYSTEMD_RESTART_COMMAND]
```

---

## Current Debugging Information

### Batch Upload Configuration
**File**: `backend/src/api/article/controllers/article.js`
**Route**: `backend/src/api/article/routes/custom-article.js`
**Endpoint**: `POST /api/articles/:id/batch-upload`

### Authentication Flow
1. Admin login → JWT token
2. Token passed in Authorization header
3. Batch upload uses same auth as regular uploads
4. Individual uploads work, batch doesn't

### Potential Issues
1. Route configuration problem
2. Middleware ordering issue
3. Permission/policy mismatch
4. Token not properly forwarded in batch request

### Next Debugging Steps
1. Check PM2/systemd logs for errors
2. Verify route registration in Strapi
3. Test with curl directly on EC2
4. Check middleware configuration
5. Verify database permissions

---

## Environment Variables (Backend)

**File**: `backend/.env`
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=[SET IN EC2]
API_TOKEN_SALT=[SET IN EC2]
ADMIN_JWT_SECRET=[SET IN EC2]
JWT_SECRET=[SET IN EC2]
DATABASE_CLIENT=postgres
DATABASE_HOST=[RDS_ENDPOINT]
DATABASE_PORT=5432
DATABASE_NAME=[DB_NAME]
DATABASE_USERNAME=[DB_USER]
DATABASE_PASSWORD=[DB_PASS]
DATABASE_SSL=true
AWS_ACCESS_KEY_ID=[S3_KEY]
AWS_ACCESS_SECRET=[S3_SECRET]
AWS_REGION=[REGION]
AWS_BUCKET=[BUCKET_NAME]
```

---

## Testing Status

**Test Suite**: Implemented  
**Last Test Run**: [Run ./run-tests-for-claude.sh to update]  
**Test Results**: [To be updated]  
**Critical Test**: Upload tests - reproduces 401 error

### Test Commands
```bash
# Full test suite
./run-tests-for-claude.sh

# Just upload tests (reproduces 401 error)
cd tests && node upload-tests.js

# Smoke tests only
./tests/smoke-tests.sh
```

### Test Configuration Required
- [BACKEND_URL]: Backend URL (https://api.silkytruth.com)
- [FRONTEND_URL]: Frontend URL  
- [TEST_EMAIL]: Test user email for authentication
- [TEST_PASSWORD]: Test user password
- [EC2_IP]: EC2 instance IP for SSH tests

---

## Recent Changes Log

### 2025-01-06 - Added Testing Infrastructure
- Created comprehensive test suite with upload-tests.js
- Added run-tests-for-claude.sh main test runner
- Set up smoke tests for health checks
- Configured test logging to tests/logs/
- Added npm test infrastructure
- Tests will reproduce 401 error consistently

### 2025-01-06 - Initial Context Creation
- Created project context documentation
- Identified batch upload 401 error as critical issue
- Set up debugging plan
- Merged information from backend and frontend context files

---

## Links & Resources

- [Strapi v4 Documentation](https://docs.strapi.io/developer-docs/latest/getting-started/introduction.html)
- [Next.js 11 Documentation](https://nextjs.org/docs)
- [AWS Amplify Console](https://console.aws.amazon.com/amplify)
- [Project Repository](https://github.com/[NEED VALUE])

---

## Notes

- Always use `--legacy-peer-deps` for frontend
- Node options required: `--openssl-legacy-provider`
- Backend requires all environment variables
- Don't commit .env files
- Test locally before deploying

---

## Contact

**Developer**: Nikita Kozlov  
**Project**: Photography Blog (Silky Truth)

Last Updated: 2025-01-06