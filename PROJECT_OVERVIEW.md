# Photography Blog - Project Overview

## Quick Start

### Local Development
```bash
# Backend
cd backend
npm install
npm run develop      # Admin at http://localhost:1337/admin

# Frontend
cd frontend
npm install --legacy-peer-deps

# Windows PowerShell
$env:NODE_OPTIONS="--openssl-legacy-provider"; $env:USE_CLOUD_BACKEND="false"; npm run dev

# Unix/Linux/Mac
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev
```

### Production Access
- **Frontend**: https://www.silkytruth.com
- **Backend API**: https://api.silkytruth.com
- **Admin Panel**: https://api.silkytruth.com/admin

## Architecture

### Technology Stack
- **Backend**: Strapi CMS v4.2.0 (Node.js)
- **Frontend**: Next.js v11.0.0 (React)
- **Database**: PostgreSQL (AWS RDS)
- **Storage**: AWS S3
- **Hosting**: AWS EC2 (backend), AWS Amplify (frontend)

### Key Features
1. **Dynamic Content Loading**: CMS changes appear immediately without frontend redeployment
2. **Batch Image Upload**: Drag-and-drop multiple images to galleries
3. **Image Focal Points**: Smart cropping for responsive images
4. **PhotoSwipe Galleries**: Modern masonry layout with lightbox
5. **Dark Mode**: System-aware theme switching
6. **Konami Code Easter Egg**: Hidden character animations

## Deployment

### Frontend Deployment (AWS Amplify) - CRITICAL RULES

#### **⚠️ BEFORE DEPLOYING: Test Export Locally**
```bash
cd frontend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run build
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run export
# If this fails, AWS Amplify will fail
```

#### **Deploy to Production**
```bash
git add .
git commit -m "Your changes"
git push origin master  # Triggers automatic deployment (~8 minutes)
```

#### **AWS Amplify Requirements:**
- ✅ `fallback: false` in ALL `getStaticPaths`
- ✅ `next export` must succeed
- ❌ NO `fallback: 'blocking'` or `true`
- ❌ NO API routes in `pages/api/`
- ❌ NO `getServerSideProps`

### Backend Deployment (AWS EC2)
```bash
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130
cd /home/ubuntu/photography-blog/backend
git pull origin master
npm install
npm run build
pm2 restart photography-blog
```

## Recent Solutions

### ✅ Gallery Image Previews
- **Feature**: Visual gallery management in Strapi admin
- **Solution**: Custom CSS injection displaying thumbnails in accordion items
- **Status**: Working - 300px previews with dark mode styling

### ✅ Umami Analytics
- **Feature**: Privacy-focused analytics for production site
- **Solution**: Conditional script loading (production only)
- **Status**: Working - tracking live users only, no dev interference

### ✅ Forced Dark Mode (Admin)
- **Feature**: Consistent dark theme in Strapi admin panel
- **Solution**: Bootstrap-level theme enforcement
- **Status**: Working - admin always displays in dark mode

### ✅ Batch Upload Fix
- **Issue**: 401 Unauthorized errors
- **Solution**: Use standard `/upload` endpoint + content-manager API
- **Status**: Working - 100+ images uploaded successfully

### ✅ Dynamic Content Updates
- **Issue**: CMS changes required frontend rebuild
- **Solution**: Client-side data fetching on page load
- **Status**: Working - changes appear immediately

### ✅ AWS S3 Integration
- **Issue**: Images stored locally causing disk space issues
- **Solution**: Fixed AWS_BUCKET_NAME environment variable
- **Status**: Working - all uploads go to S3

## Environment Variables

### Backend (.env)
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=[secure keys]
JWT_SECRET=[secure secret]
DATABASE_CLIENT=postgres
DATABASE_HOST=[RDS endpoint]
DATABASE_NAME=photography_blog
DATABASE_USERNAME=[username]
DATABASE_PASSWORD=[password]
AWS_ACCESS_KEY_ID=[S3 key]
AWS_ACCESS_SECRET=[S3 secret]
AWS_REGION=us-west-2
AWS_BUCKET_NAME=photography-blog-images
```

### Frontend
- `USE_CLOUD_BACKEND`: Toggle local/cloud backend
- `NODE_OPTIONS=--openssl-legacy-provider`: Required for compatibility

## Development Notes

1. Always use `--legacy-peer-deps` for frontend installs
2. Test locally before deploying
3. Backend changes need manual deployment to EC2
4. Frontend changes auto-deploy via Amplify
5. CMS content changes appear immediately (no redeploy needed)

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Last Updated**: January 2025