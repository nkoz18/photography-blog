# Development Guide

This file provides development guidance and documentation for this repository.

## Architecture Overview

This is a photography blog monorepo with:
- **Backend**: Strapi CMS v4.2.0 (headless CMS) at `/backend`
- **Frontend**: Next.js v11.0.0 (static site generator) at `/frontend`

The backend provides REST APIs for content management, while the frontend consumes these APIs and generates a static site.

## Essential Commands

### Backend Development
```bash
cd backend
npm install
npm run develop      # Development server at http://localhost:1337/admin
npm run build        # Build admin panel
npm run start        # Production server
```

### Frontend Development
```bash
cd frontend
npm install --legacy-peer-deps

# Local backend (Windows PowerShell)
$env:NODE_OPTIONS="--openssl-legacy-provider"; $env:USE_CLOUD_BACKEND="false"; npm run dev

# Local backend (Unix/Linux/Mac)
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev

# Cloud backend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run dev

# Build and deploy
npm run build        # Build production
npm run export       # Export static site
npm run deploy       # Build + export

# Code quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
```

## Key Architecture Details

### Content Types (Backend)
- **Article**: Blog posts with title, content, slug, categories, image, author, and gallery
- **Category**: Content categories
- **Writer**: Article authors
- **Global**: Site-wide settings
- **Homepage**: Homepage content

### Custom Features

1. **Image Focal Points**: 
   - Stored in `provider_metadata.focalPoint` as `{x, y}` percentages
   - UI at `/admin/plugins/upload/assets`
   - Update endpoint: `/upload/updateFocalPoint/:id`

2. **Batch Image Upload**:
   - Custom component: `backend/src/admin/extensions/components/BatchImageUpload/index.js`
   - Uses standard `/upload` endpoint followed by content-manager API
   - Attaches uploaded files to article galleries automatically
   - Handles multiple image uploads with drag-and-drop interface

3. **Dynamic Content Loading**:
   - Frontend fetches fresh content from CMS on every page load
   - CMS changes appear immediately without frontend redeployment
   - Static export + client-side data fetching for optimal performance

4. **Konami Code Easter Egg**:
   - Component: `frontend/components/KonamiEasterEgg.js`
   - Triggers character animations on specific sequence
   - Uses React Portal for rendering

### API Structure
- Base URL (local): `http://localhost:1337`
- Base URL (cloud): `https://api.silkytruth.com`
- Authentication: JWT tokens
- Standard REST endpoints: `/api/{content-type}`

### Environment Configuration
Backend requires `.env` with:
- Database configuration (SQLite local, PostgreSQL production)
- AWS S3 credentials for media uploads
- JWT secrets and security settings

Frontend uses:
- `USE_CLOUD_BACKEND`: Toggle between local/cloud backend
- `NODE_OPTIONS=--openssl-legacy-provider`: Required for OpenSSL compatibility

### Deployment
- Backend: AWS EC2 + RDS PostgreSQL + S3
- Frontend: AWS Amplify (static site from `/frontend/out`)
- Build config: `amplify.yml`

## Development Notes

1. When modifying image handling, consider focal points in responsive contexts
2. Batch uploads must update the article's gallery field
3. Frontend builds require `--legacy-peer-deps` due to dependency conflicts
4. Always use environment variables for sensitive data
5. The Easter egg should not interfere with normal site functionality

## Recent Changes and Solutions

### Batch Upload Authentication Fix
- **Issue**: Batch upload failing with 401 Unauthorized errors
- **Solution**: Implemented workaround using standard `/upload` endpoint + content-manager API
- **Location**: `backend/src/admin/extensions/components/BatchImageUpload/index.js`
- **Status**: ✅ Working - User successfully uploaded 100+ images

### AWS S3 Storage Configuration  
- **Issue**: Images being stored locally on EC2 instead of S3, causing disk space issues
- **Solution**: Fixed environment variable naming (`AWS_BUCKET` → `AWS_BUCKET_NAME`)
- **Location**: `backend/config/plugins.js`
- **Status**: ✅ Working - All uploads now go to S3

### Frontend Dynamic Content Loading
- **Issue**: CMS changes required frontend redeployment to appear
- **Solution**: Implemented client-side data fetching on page load
- **Locations**: 
  - `frontend/pages/article/[slug].js`
  - `frontend/pages/index.js`
- **Status**: ✅ Working - CMS changes appear immediately without redeployment

### Disk Space Cleanup
- **Issue**: EC2 instance at 98% disk usage from local image storage
- **Solution**: Cleaned up local uploads directories, freed ~182MB
- **Status**: ✅ Complete - Disk usage reduced to 86%

## Deployment Notification Rule

**IMPORTANT**: Upon completing any changes to the codebase, always inform the user about deployment requirements. Refer to PROJECT_OVERVIEW.md for deployment instructions.

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog Development Documentation