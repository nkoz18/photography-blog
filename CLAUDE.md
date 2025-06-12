# Development Guide

This file provides Claude-specific development guidance and critical project information.

## 📚 Quick Reference

For comprehensive documentation, see:
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Architecture, setup, deployment
- **[BACKEND-CONTEXT.md](backend/BACKEND-CONTEXT.md)** - Strapi backend details
- **[FRONTEND-CONTEXT.md](frontend/FRONTEND-CONTEXT.md)** - Next.js frontend details
- **[Database Sync Guide](backend/database-sync/README.md)** - Production data sync

## 🚀 Quick Start (Claude-Specific)

### Development Server Commands

**⚠️ CRITICAL: Never use `timeout` with background processes - it kills servers unpredictably!**

```bash
# Kill existing processes (Claude: always run first)
pkill -f "npm run develop" && pkill -f "npm run dev" && pkill -f "next dev" || true

# Start backend (no timeout!)
cd backend && nohup npm run develop > ../logs/backend.log 2>&1 & sleep 5

# Start frontend (no timeout!)  
cd frontend && nohup bash -c 'NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev' > ../logs/frontend.log 2>&1 & sleep 5

# ALWAYS verify both servers started
curl -s http://localhost:1337 > /dev/null && echo "Backend ✓" || echo "Backend ✗"
curl -s http://localhost:3000 > /dev/null && echo "Frontend ✓" || echo "Frontend ✗"
```

**Claude Instructions:**
- **NEVER use `timeout`** - it causes unpredictable server termination
- Use `nohup` and `&` for background processes WITHOUT timeout
- Always verify server status with curl commands after starting
- Check logs if servers don't start: `logs/backend.log` and `logs/frontend.log`
- Backend: http://localhost:1337, Frontend: http://localhost:3000

### Production Testing (Required Before Deploy)
```bash
cd frontend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run build
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run export
# If export fails, AWS Amplify deployment will fail
```

## 🏗️ Project-Specific Features

### Image Focal Points System
- **Backend Storage**: `provider_metadata.focalPoint` as `{x, y}` percentages
- **Admin UI**: Available at `/admin/plugins/upload/assets` with visual crosshair
- **Frontend Implementation**: CSS `object-fit: cover` + `object-position`
- **Key Files**: `frontend/components/image.js`, focal point extraction logic

### Client Sharing (Obscurity Tokens)
- **Purpose**: Share unpublished articles with clients for preview
- **Backend Endpoint**: `/api/articles/:id/generate-token` (POST)
- **Frontend Detection**: Client-side `slug~token` URL parsing
- **URL Format**: `https://www.silkytruth.com/article/{slug}~{token}`
- **Security**: 12-character tokens, complete SEO protection, no static generation

### Batch Image Upload
- **Component**: `backend/src/admin/extensions/components/BatchImageUpload/index.js`
- **Endpoint**: `/api/articles/:id/batch-upload` (POST)
- **Function**: Drag-and-drop multiple images to article galleries

### Gallery Image Previews (Admin)
- **Component**: `backend/src/admin/extensions/components/CustomGalleryCSS/index.js`
- **Function**: Shows 300px image previews in admin accordion items
- **Dependency**: Local image proxy system for S3-hosted images

## 🎨 UI/UX Style Guide

### Color Palette
- **Primary**: `#ff007f` (RGB: 255, 0, 127) - Bright magenta/pink
- **Dark Background**: `#1a1a1a` (RGB: 26, 26, 26)

### Typography (Google Fonts)
- **Logo**: Barriecito
- **Headings**: Kirang Haerang  
- **Body/Readable**: IBM Plex Mono

### Design Rules
- **NO ROUNDED CORNERS**: Never use `border-radius`
- **Primary Color**: Use `#ff007f` for all interactive elements
- **Dark Mode**: Must apply to ALL elements without flash

## 🔒 Security Guidelines

### Environment Variables (Set Locally)
```bash
export LOCAL_DB_PASSWORD="your_local_postgres_password"
export PRODUCTION_DB_PASSWORD="your_production_postgres_password"
export SSH_KEY_PATH="~/.ssh/ec2-strapi-key-pair.pem"
export PRODUCTION_SERVER="ubuntu@44.246.84.130"
export PRODUCTION_DB_HOST="photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com"
```

**Critical**: Never commit credentials. All database sync scripts use environment variables.

## 📁 File Organization (Claude Rules)

### Logs Directory (`/logs/`)
- **ALL development logs must go here**
- Automatically gitignored, safe to delete
- Usage: `npm run develop > logs/backend.log 2>&1 &`

### Scripts Directory (`/scripts/`)
- **One-off utilities only** - debugging, admin helpers
- Automatically gitignored, safe to delete
- For permanent scripts, use appropriate service directories

## ⚠️ AWS Amplify Critical Rules

### Static Export Requirements
- **MUST use `fallback: false`** in all `getStaticPaths`
- **NEVER use `getServerSideProps`** (breaks static export)
- **NEVER create `/pages/api/` routes** (not supported)
- Test `npm run export` locally before deploying

### CSP Configuration
Located in `amplify.yml`:
```yaml
customHeaders:
  - pattern: '**/*'
    headers:
      - key: 'Content-Security-Policy'
        value: "default-src 'self' https://api.silkytruth.com; connect-src 'self' https://api.silkytruth.com https://cloud.umami.is https://api-gateway.umami.dev;"
```

## 🔧 Development Notes

1. **Focal Points**: Consider responsive contexts when modifying image handling
2. **Batch Uploads**: Must update article's gallery field structure
3. **Dependencies**: Frontend requires `--legacy-peer-deps`
4. **Admin Extensions**: Require `npm run build` after modifications
5. **Gallery Previews**: Depend on local image proxy system
6. **Analytics**: Only loads in production (`NODE_ENV=production`)
7. **Report Modal**: Use `/reset-sessions.html` to clear testing data

## 🚨 Troubleshooting

### ⚠️ Server Startup Issues (CRITICAL)
- **Problem**: Claude uses `timeout` with background processes, killing servers unpredictably
- **Solution**: Use ONLY `nohup command > logs/file.log 2>&1 & sleep 5` - NO timeout
- **Verification**: ALWAYS check `curl -s http://localhost:1337` and `curl -s http://localhost:3000` 
- **Common Confusion**: Timeout errors ≠ server startup failure. Check actual server status, not timeout messages
- **Logs**: Check `logs/backend.log` and `logs/frontend.log` for actual startup status

### Report Modal Issues
- **False "Already Reported"**: Visit `http://localhost:3000/reset-sessions.html`
- **Mobile Overflow**: Check `.step2-option-button` has `width: auto`
- **Background Scrolling**: Verify `body:has(.report-modal-overlay)` CSS rules

### PhotoSwipe Integration
- **Wrong Image ID**: Uses `change` event for reliable slide tracking
- **Console Logging**: Check detailed slide change logs for debugging

## 📦 Deployment Notification

**Upon completing changes, always inform user about deployment:**

### Frontend (AWS Amplify)
- **Trigger**: `git push origin master`
- **Automatic**: Builds and deploys automatically
- **Verification**: Check https://www.silkytruth.com

### Backend (AWS EC2)
- **Trigger**: Manual deployment required
- **Process**: SSH to EC2, pull changes, restart services
- **Verification**: Check https://api.silkytruth.com/admin

### Critical Files Requiring Deployment
- **Frontend changes**: Any file in `/frontend/` → AWS Amplify
- **Backend changes**: Any file in `/backend/` → Manual EC2 deployment
- **Database schema**: Requires backend restart + potential migration

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog Development Guide for Claude