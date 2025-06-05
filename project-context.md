# Project Context - Photography Blog

## Current Priority Tasks

### 1. 🟢 RESOLVED: Batch Upload 401 Unauthorized Error
**Status**: ✅ FIXED  
**Resolution**: Fixed route authentication scope and user permissions
**Details**: Issue was with route configuration requiring `["find", "update"]` scope but user lacked permissions

#### Final Resolution
```
Root Cause: Route auth config and users-permissions plugin configuration
Solution: Updated route to use proper auth configuration
Location: backend/src/api/article/routes/custom-article.js
```

#### System Information - COMPLETE
- **EC2 Instance ID**: i-0a6d92cff60d0595d  
- **EC2 Public IP**: 44.246.84.130
- **EC2 Private IP**: 172.31.15.234
- **EC2 Username**: ubuntu
- **SSH Key Path**: ~/.ssh/ec2-strapi-key-pair.pem
- **Strapi Directory on EC2**: /home/ubuntu/photography-blog/backend
- **Backend URL**: https://api.silkytruth.com
- **Frontend URL**: https://www.silkytruth.com
- **Process Manager**: PM2 (photography-blog)

### 2. 🔴 CRITICAL: Fix CORS Issue for Image Loading
**Status**: In Progress  
**Priority**: High
**Details**: Frontend can't load images due to CORS policy blocking cache-control header

#### Error Information
```
Access to fetch at 'https://api.silkytruth.com/uploads/film_ocf_2024_1_b3ab44b614.JPG' 
from origin 'https://www.silkytruth.com' has been blocked by CORS policy: 
Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response.
```

### 3. Frontend Build Warning
**Status**: Not Started  
**Priority**: Medium
**Details**: Legacy peer deps and OpenSSL warnings during build

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
# Connect to EC2
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130

# Navigate to backend directory
cd /home/ubuntu/photography-blog/backend

# View PM2 status
pm2 status

# View logs
pm2 logs photography-blog --lines 20

# Restart backend
pm2 restart photography-blog
```

### Deploy Backend Changes
```bash
# Copy file to EC2
scp -i ~/.ssh/ec2-strapi-key-pair.pem /local/file/path ubuntu@44.246.84.130:/home/ubuntu/photography-blog/backend/path

# Or manually on EC2
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130
cd /home/ubuntu/photography-blog/backend
git pull origin master
npm install
npm run build
pm2 restart photography-blog
```

### Git Sync Commands
```bash
# Before making changes - pull latest
git pull origin master

# After making changes - commit and push
git add .
git commit -m "Your commit message"
git push origin master

# Keep EC2 in sync with latest changes
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130 "cd /home/ubuntu/photography-blog && git pull origin master && cd backend && pm2 restart photography-blog"
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

### Test Configuration - COMPLETE
- **BACKEND_URL**: https://api.silkytruth.com
- **FRONTEND_URL**: https://www.silkytruth.com  
- **TEST_EMAIL**: bot@silkytruth.com
- **TEST_PASSWORD**: V>C'[21|W}7p
- **EC2_IP**: 44.246.84.130

### Test User Information
- **Created**: API user via /api/auth/local/register
- **Purpose**: Testing batch upload and API functionality  
- **Permissions**: Default authenticated user role
- **Note**: Can be deleted via admin panel if not needed

### Quick Test Command
```bash
# Test batch upload works
curl -X POST "https://api.silkytruth.com/api/articles/7/batch-upload" \
  -H "Authorization: Bearer $(curl -s -X POST "https://api.silkytruth.com/api/auth/local" \
  -H "Content-Type: application/json" \
  -d '{"identifier": "bot@silkytruth.com", "password": "V>C'\''[21|W}7p"}' | \
  grep -o '"jwt":"[^"]*"' | cut -d'"' -f4)" \
  -F "files=@/path/to/test/image.jpg"
```

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

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog (Silky Truth)

Last Updated: 2025-01-06