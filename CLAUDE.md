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

### Quick Start Instructions

**Important**: Always check for existing Node processes before starting to avoid conflicts:

```bash
# Check and kill any existing Node.js processes from previous sessions
pkill -f "npm run develop" || true
pkill -f "npm run dev" || true
pkill -f "strapi develop" || true
pkill -f "next dev" || true
```

**For Local Development with Images (Recommended for Feature Development):**
```bash
# Kill any existing processes and start fresh
pkill -f "npm run develop" && pkill -f "npm run dev" || true

# Start backend with PostgreSQL database (use timeout to prevent hanging)
cd backend && timeout 120 nohup npm run develop > ../backend-postgres.log 2>&1 &

# Start frontend with local backend (shows production images via proxy, use timeout to prevent hanging)
cd frontend && timeout 120 nohup bash -c 'NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev' > ../frontend-local.log 2>&1 &
```

**IMPORTANT**: When using Bash tool to start servers:
- Always use `timeout` command to prevent hanging (max 120 seconds for npm commands)
- Use `nohup` and `&` for background processes 
- The `pkill` command may show error but will succeed - this is normal
- Backend starts at http://localhost:1337, frontend at http://localhost:3000
This runs:
- Frontend at http://localhost:3000 (using local backend)
- Backend at http://localhost:1337 (PostgreSQL with production data)
- Images served via local proxy from S3

**For Frontend-Only Development:**
```bash
# Kill any existing processes and start fresh
pkill -f "npm run dev" || true

cd frontend && nohup bash -c 'NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run dev' > ../frontend.log 2>&1 &
```
This runs the frontend at http://localhost:3000 using the cloud backend (https://api.silkytruth.com).

## Key Architecture Details

### Content Types (Backend)
- **Article**: Blog posts with title, content, slug, categories, image, author, and gallery
- **Category**: Content categories
- **Writer**: Article authors
- **Global**: Site-wide settings
- **Homepage**: Homepage content

### Custom Features

1. **Image Focal Points**: 
   - **Storage**: Stored in `provider_metadata.focalPoint` as `{x, y}` percentages (0-100)
   - **Admin UI**: Available at `/admin/plugins/upload/assets` with visual crosshair selector
   - **Backend API**: Update endpoint `/upload/updateFocalPoint/:id`
   - **Frontend Implementation**: 
     - Automatically applied to article cover images (width > 1000px)
     - Uses CSS `object-fit: cover` with `object-position` for precise cropping
     - Extracts focal point from multiple data sources (provider_metadata, formats, direct property)
     - Sets CSS custom property `--focal-point` with percentage values
     - Article cover images: 550px fixed height with focal point cropping
     - Thumbnail images: Natural aspect ratio (no focal point needed)
   - **Method**: Classic `object-fit: cover` + computed `object-position` percentages (Method #1)

2. **Batch Image Upload**:
   - Custom component: `backend/src/admin/extensions/components/BatchImageUpload/index.js`
   - Uses standard `/upload` endpoint followed by content-manager API
   - Attaches uploaded files to article galleries automatically
   - Handles multiple image uploads with drag-and-drop interface

3. **Gallery Image Previews (Admin)**:
   - Component: `backend/src/admin/extensions/components/CustomGalleryCSS/index.js`
   - Displays gallery images directly in accordion items (300px height)
   - Uses image proxy system for S3-hosted images
   - Dark mode compatible styling with Strapi colors
   - **Styling**: Dark backgrounds, proper borders, centered images with file labels

4. **Dynamic Content Loading**:
   - Frontend fetches fresh content from CMS on every page load
   - CMS changes appear immediately without frontend redeployment
   - Static export + client-side data fetching for optimal performance

5. **Client Sharing (Obscurity Tokens)**:
   - **Purpose**: Share unpublished articles with clients for preview/approval
   - **Admin Widget**: `backend/src/admin/extensions/components/ShareWithClient/index.js`
   - **Token Generation**: Auto-generated 12-character alphanumeric tokens stored in `obscurityToken` field
   - **API Endpoint**: `/api/articles/by-token/:slug/:token` (bypasses published status)
   - **URL Format**: `https://www.silkytruth.com/article/{slug}~{token}`
   - **Features**: Full gallery access, image downloads, reporting functionality
   - **SEO Protection**: Complete robots directives, canonical links, no indexing
   - **Security**: Tokens required for access, no internal linking, preview-only mode

6. **Forced Dark Mode (Admin)**:
   - **Bootstrap Script**: `backend/src/admin/app.js`
   - Forces Strapi admin to always use dark theme regardless of system preferences
   - Sets localStorage preferences and applies CSS classes
   - Non-intrusive implementation without console spam

7. **Umami Analytics**:
   - **Location**: `frontend/pages/_document.js`
   - **Conditional Loading**: Only loads in production (`NODE_ENV === 'production'`)
   - **Website ID**: `303b22bb-dee7-4c36-8521-5c813ad7d3d9`
   - **Privacy**: No tracking during development or local testing
   - **Script**: `https://cloud.umami.is/script.js` (deferred loading)

8. **Konami Code Easter Egg**:
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
- Database configuration (PostgreSQL for both local and production)
- AWS S3 credentials for media uploads
- JWT secrets and security settings

Frontend uses:
- `USE_CLOUD_BACKEND`: Toggle between local/cloud backend
- `NODE_OPTIONS=--openssl-legacy-provider`: Required for OpenSSL compatibility

### Deployment
- Backend: AWS EC2 + RDS PostgreSQL + S3
- Frontend: AWS Amplify (static site from `/frontend/out`)
- Build config: `amplify.yml`

## Static vs Dynamic Generation - PRODUCTION VERIFIED ✅

### **✅ CONFIRMED: Perfect Architecture for Dynamic Content Without Redeployment**

Your setup has been verified against Next.js, AWS Amplify, and Strapi best practices documentation. **Content changes in Strapi appear immediately on the frontend without AWS Amplify redeployment.**

### **AWS Amplify Requirements (FULLY SATISFIED)**

AWS Amplify static hosting requires:
- ✅ `next export` compatibility ✓ (`output: "export"` in next.config.js)
- ✅ `fallback: false` in all `getStaticPaths` ✓ (Required for static export)
- ✅ Static build artifacts in `/out` directory ✓ (Configured in amplify.yml)
- ❌ Server-side features (API routes, ISR) NOT supported ✓ (We don't use these)

### **The Hybrid Approach Solution (PRODUCTION GRADE)**

Your **hybrid static + dynamic** approach is the gold standard:

#### **Static Generation (Build Time)**
```javascript
// In getStaticPaths - MUST use fallback: false
export async function getStaticPaths() {
  const articles = await fetchAPI("/articles", { 
    filters: { publishedAt: { $notNull: true } }
  })
  
  return {
    paths: articles.data.map(article => ({ params: { slug: article.attributes.slug } })),
    fallback: false  // ← CRITICAL: Must be false for AWS Amplify
  }
}
```

#### **Dynamic Content Loading (Runtime)**
```javascript
// In component - ALWAYS fetch fresh data
useEffect(() => {
  const fetchFreshData = async () => {
    const freshData = await fetchAPI("/articles") // Always get latest
    setData(freshData.data)
  }
  fetchFreshData()
}, [])
```

### **How This Works in Practice**

1. **Build Time (Static Generation):**
   - Next.js pre-generates HTML for all published articles
   - Creates static files in `/frontend/out`
   - AWS Amplify serves these for fast initial load + SEO

2. **Runtime (Dynamic Loading):**
   - React components fetch fresh data from Strapi API
   - New content appears immediately without rebuild
   - User sees latest content even if static files are old

### **File-by-File Implementation**

#### **Homepage (`pages/index.js`)**
- ✅ Static: Pre-generates with initial articles
- ✅ Dynamic: `useEffect` fetches fresh articles on every load
- ✅ Result: New articles appear immediately

#### **Article Pages (`pages/article/[slug].js`)**
- ✅ Static: Pre-generates paths for published articles only
- ✅ Dynamic: Always fetches fresh content including focal points and galleries
- ✅ Special: Tokenized URLs (`slug~token`) handled purely client-side

#### **Category Pages (`pages/category/[slug].js`)**
- ✅ Static: Pre-generates paths for all categories
- ✅ Dynamic: Fetches fresh articles assigned to that category
- ✅ Result: New articles appear in correct categories immediately

### **AWS Amplify Build Process**

```yaml
# amplify.yml - The build that MUST succeed
build:
  commands:
    - NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run deploy

# npm run deploy executes:
# 1. next build (creates .next/)
# 2. next export (creates out/ - THIS MUST NOT FAIL)
```

### **Common Deployment Failures & Solutions**

#### **❌ Error: "Pages with `fallback` enabled cannot be exported"**
**Problem:** Used `fallback: 'blocking'` or `true` in `getStaticPaths`
**Solution:** ALWAYS use `fallback: false`

#### **❌ Error: "API routes are not supported"**
**Problem:** Created files in `pages/api/`
**Solution:** Remove API routes, use backend endpoints instead

#### **❌ Error: "getServerSideProps is not supported"**
**Problem:** Used SSR instead of SSG
**Solution:** Use `getStaticProps` + client-side fetching

### **Environment Variables for Different Modes**

#### **Local Development:**
```bash
USE_CLOUD_BACKEND=false  # Uses http://localhost:1337
```

#### **AWS Amplify Build:**
```bash
USE_CLOUD_BACKEND=true   # Uses https://api.silkytruth.com
```

### **Testing Before Deployment**

⚠️ **CRITICAL:** Development mode (`npm run dev`) behaves differently than production. `getStaticPaths` runs on every request in development, making it forgiving, but production uses caching.

**ALWAYS test in production mode before deploying:**

```bash
cd frontend
# Test production build (required to understand real behavior)
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run build
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm start

# Test static export (required for AWS Amplify)
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run export
# If this fails, AWS Amplify will fail
```

### **Special Features Compatibility**

#### **✅ Tokenized URLs (Client Previews)**
- Static: Not pre-generated (would expose tokens)
- Dynamic: Handled entirely client-side via `useEffect`
- Result: Preview URLs work without breaking static export

#### **✅ Real-time Content Updates**
- Static: Provides fast initial load
- Dynamic: `useEffect` on every page ensures fresh content
- Result: Publish → appears immediately without rebuild

#### **✅ SEO + Performance**
- Static: Search engines get pre-rendered HTML
- Dynamic: Users get latest content
- Result: Best of both worlds

### **Why Your Approach Beats ISR (Incremental Static Regeneration)**

**ISR Limitations for Your Use Case:**
```javascript
// ISR approach - Has delays and limitations
export async function getStaticProps() {
  return {
    props: { articles: await fetchAPI("/articles") },
    revalidate: 60  // ❌ 60-second delay for updates
  }
}

export async function getStaticPaths() {
  return {
    paths: [...],
    fallback: 'blocking'  // ❌ Breaks AWS Amplify static export
  }
}
```

**Your Hybrid Approach Advantages:**
- ✅ **Immediate updates** (no revalidation delays)
- ✅ **AWS Amplify compatible** (static export + client fetching)
- ✅ **Better performance** (static HTML + fresh data)
- ✅ **Tokenized URLs supported** (client-side only, secure)
- ✅ **Cost effective** (no server runtime costs)
- ✅ **SEO optimized** (static HTML for crawlers)

**Your architecture is superior to ISR for this use case.**

### **CRITICAL DEVELOPMENT RULES**

1. **NEVER use `fallback: 'blocking'` or `true`** (breaks AWS Amplify)
2. **ALWAYS test `npm run export` before deploying**
3. **ALWAYS test in production mode** (`npm run build && npm start`)
4. **ALL dynamic content via `useEffect` + client-side fetching**
5. **Published content = static paths, unpublished = client-side only**
6. **AWS Amplify build MUST complete or entire deployment fails**

This hybrid approach ensures:
- ✅ AWS Amplify deployments never fail
- ✅ Content appears immediately after publishing (no revalidate delays)
- ✅ SEO benefits from static generation
- ✅ Performance benefits from caching
- ✅ Preview URLs work for client sharing
- ✅ Works within AWS Amplify limitations

## UI/UX Style Guide

When creating or modifying UI elements, follow these strict guidelines:

### Color Palette
- **Primary Color**: `#ff007f` (RGB: 255, 0, 127) - Bright magenta/pink
- **White**: `#ffffff` (RGB: 255, 255, 255)
- **Dark Mode Background**: `#1a1a1a` (RGB: 26, 26, 26) - Dark gray

### Typography
Only use the predefined Google Fonts:
- **Article Content (Readable)**: IBM Plex Mono - Used for body text, descriptions, readable content
- **Headings/Display (Stylized)**: Kirang Haerang - Used for titles, headings, decorative text
- **Logo**: Barriecito - Used specifically for branding elements

### Design Principles
- **NO ROUNDED CORNERS**: Never use `border-radius` on any elements
- **Consistent Color Usage**: Always use the primary color `#ff007f` for interactive elements, highlights, and accents
- **High Contrast**: Ensure proper contrast ratios for accessibility

### Dark Mode Implementation
- Dark mode must apply to ALL elements without flash of white content
- Use CSS custom properties for seamless theme switching
- Ensure dark mode activates immediately on page load
- Test orientation changes and page reloads for consistent dark backgrounds

### Example CSS Structure
```css
:root {
  --primary-color: #ff007f;
  --primary-rgb: 255, 0, 127;
  --white: #ffffff;
  --dark-bg: #1a1a1a;
  --text-readable: 'IBM Plex Mono', monospace;
  --text-stylized: 'Kirang Haerang', cursive;
  --text-logo: 'Barriecito', cursive;
}

/* NO rounded corners - always use sharp edges */
.element {
  border-radius: 0; /* Or omit entirely */
  background-color: var(--primary-color);
  font-family: var(--text-readable);
}
```

### Component Guidelines
- Buttons: Use primary color with white text, no rounded corners
- Cards: Sharp rectangular edges, proper dark mode support
- Modals: Consistent with overall design system
- Forms: IBM Plex Mono for inputs, clear visual hierarchy

## Development Notes

1. When modifying image handling, consider focal points in responsive contexts
2. Batch uploads must update the article's gallery field
3. Frontend builds require `--legacy-peer-deps` due to dependency conflicts
4. Always use environment variables for sensitive data
5. The Easter egg should not interfere with normal site functionality
6. **Follow UI/UX Style Guide** for all new components and modifications
7. **Test dark mode thoroughly** on page loads, reloads, and orientation changes
8. **Admin panel rebuilds** required after modifying admin extensions: `npm run build`
9. **Gallery previews** use image proxy system - ensure backend proxy endpoint is running
10. **Analytics** only loads in production - test locally with `NODE_ENV=production`
11. **Dark mode enforcement** applies automatically on admin bootstrap - no user intervention needed
12. **Report modal testing** - Use `/reset-sessions.html` to clear session storage between tests
13. **Rough.js report modal** - All components use hand-drawn aesthetic with responsive breakpoints

## Security Guidelines 🔒

### **⚠️ CRITICAL: Never Commit Credentials**

**Environment Variables Required (Set Locally):**
```bash
# Local Development
export LOCAL_DB_PASSWORD="your_local_postgres_password"
export PRODUCTION_DB_PASSWORD="your_production_postgres_password"

# Database Sync Scripts
export SSH_KEY_PATH="~/.ssh/ec2-strapi-key-pair.pem"
export PRODUCTION_SERVER="ubuntu@44.246.84.130"
export PRODUCTION_DB_HOST="photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com"
```

**Files Using Environment Variables:**
- ✅ `backend/database-sync/db-sync.sh` - Uses `$PRODUCTION_DB_PASSWORD`
- ✅ `backend/database-sync/main-workflow/update-urls-to-proxy.js` - Uses `process.env.LOCAL_DB_PASSWORD`
- ✅ All database sync scripts secured

**GitGuardian Monitoring:**
- Monitor for accidental credential commits
- Immediately rotate exposed credentials
- See `SECURITY.md` for emergency response procedures

## File Organization Standards

### **Logs Directory** (`/logs/`)
- ✅ **ALL development logs** must go here
- ✅ **Automatically gitignored** - never committed
- ✅ **Safe to delete** - logs can be regenerated
- **Usage**: `npm run develop > logs/backend-dev.log 2>&1 &`

### **Scripts Directory** (`/scripts/`)  
- ✅ **One-off utilities only** - debugging tools, admin helpers, test scripts
- ✅ **Automatically gitignored** - never committed (may contain credentials)
- ✅ **Safe to delete** - temporary development helpers
- **Usage**: Put any utility script here: `scripts/debug-api.js`

### **Permanent Scripts Location**
- **Testing workflows** → `tests/` directory
- **Database operations** → `backend/database-sync/` directory
- **Core functionality** → Integrate into main codebase
- **Deployment scripts** → Keep in service directories

### **Developer Guidelines**
When Claude Code or any developer creates temporary files:
1. **Logs** → Always output to `logs/` directory
2. **Debug scripts** → Always create in `scripts/` directory
3. **Test files** → Use `tests/` directory for permanent tests
4. **Never scatter** temporary files in project root

## Recent Changes and Solutions

### Mobile Typography & Image Display Improvements (Complete)
- **Issues**: 
  - Mobile cover images excessively zoomed with poor focal point display
  - Article paragraph text too large on mobile (18px)
- **Solutions**: 
  - **Mobile Cover Images**: Implemented responsive height scaling with better focal point proportions:
    - Desktop: 550px height with focal point cropping
    - Tablet (768px): 350px height for better proportions  
    - Mobile (480px): 300px height for optimal display
  - **Mobile Typography**: Reduced article paragraph font size from 18px to 16px on mobile with improved line height (1.7)
- **Result**: Better mobile reading experience with properly scaled images and comfortable text size
- **Status**: ✅ Complete - Mobile display now optimized for both images and text

### Image Focal Points Implementation (Complete)
- **Issue**: Focal points were stored in backend but not applied on frontend - images always showed center crop
- **Solution**: Implemented complete focal point system using CSS `object-fit: cover` + `object-position`
- **Implementation**:
  - Enhanced `Image` component to extract focal points from multiple data sources
  - Applied focal points to article cover images with responsive heights (see Mobile improvements above)
  - Used CSS custom property `--focal-point` with percentage positioning
  - Preserved natural aspect ratio for thumbnail images (no focal point needed)
  - Enhanced debug logging for mobile viewport testing
- **Method**: Classic `object-fit: cover` + computed `object-position` percentages (most reliable approach)
- **Result**: When focal point is set in admin (e.g., 50.67%, 97.71%), that area stays visible in cropped cover images across all devices
- **Status**: ✅ Complete - Focal points now work correctly on article cover images with proper mobile responsiveness

### Gallery Image Previews in Admin (Complete)
- **Issue**: Need visual gallery management in Strapi admin for large photo collections
- **Solution**: Custom CSS injection component that displays images in accordion items
- **Implementation**:
  - Component: `backend/src/admin/extensions/components/CustomGalleryCSS/index.js`
  - Uses `aria-controls^="accordion-content-gallery.gallery_items"` selector to find gallery buttons
  - Applies 300px height to parent containers via JavaScript class injection
  - Loads thumbnail images via local image proxy system
  - Dark mode compatible styling with Strapi color palette
- **Features**: Centered images, file name labels, 280px thumbnails, proper error handling
- **Status**: ✅ Complete - Gallery management now visual and intuitive

### Umami Analytics Integration (Complete)
- **Issue**: Need privacy-focused analytics for production site only
- **Solution**: Conditional script loading based on NODE_ENV
- **Implementation**:
  - Location: `frontend/pages/_document.js`
  - Production check: `process.env.NODE_ENV === 'production'`
  - Website ID: `303b22bb-dee7-4c36-8521-5c813ad7d3d9`
  - Script: `https://cloud.umami.is/script.js` (deferred)
- **Benefits**: No dev tracking, clean data, automatic deployment compatibility
- **Status**: ✅ Complete - Analytics active on production only

### Forced Dark Mode for Admin Panel (Complete)
- **Issue**: Strapi admin switching between light/dark modes causing UI inconsistency
- **Solution**: Bootstrap-level theme enforcement with minimal observer pattern
- **Implementation**:
  - Bootstrap function in `backend/src/admin/app.js`
  - Sets localStorage preferences and DOM attributes
  - Simple timeout-based re-enforcement (no aggressive observers)
  - Eliminated console logging spam
- **Features**: Persistent dark mode, no user intervention required, clean console
- **Status**: ✅ Complete - Admin always displays in dark mode

### Report Modal with Rough.js Implementation (Complete)
- **Issue**: Replace static SVG background in report modal with dynamic hand-drawn rough.js aesthetic
- **Solution**: Complete rough.js integration with comprehensive responsive design and session tracking
- **Components**:
  - RoughCanvas component: `frontend/components/RoughCanvas.js` (dynamic canvas drawing)
  - Report modal: `frontend/components/ReportModal.js` (rough.js integration + animations)
  - Session storage: `frontend/lib/reportStorage.js` (prevents duplicate reports)
  - PhotoSwipe integration: `frontend/components/PhotoSwipeGallery.js` (proper current slide tracking)
  - Reset utility: `frontend/public/reset-sessions.html` (testing tool)
- **Features**: 
  - Hand-drawn rough.js aesthetic with varying roughness levels
  - Session storage prevents duplicate reports with friendly "sleepy cat" message
  - Responsive design: mobile (≤640px), tablet (641-960px), desktop (≥961px)
  - Proper PhotoSwipe current slide tracking using change events
  - Background scroll prevention for both PhotoSwipe and report modal
  - Framer Motion animations with jittery entrance/exit effects
  - Black-outlined floating Z's animation for visual appeal
- **Status**: ✅ Complete - Fully responsive with proper image tracking and UX polish

### Client Sharing Feature Implementation (Complete + Security Fix)
- **Issue**: Need to share unpublished articles with clients for preview/approval
- **Original Problem**: 403 Forbidden errors when generating share links in production
- **Root Cause**: Admin panel making PUT requests to REST API with permission conflicts
- **Solution**: Implemented dedicated token generation endpoint bypassing permission issues
- **Components**:
  - **Backend API endpoint**: `POST /api/articles/:id/generate-token` (dedicated token generation)
  - **Admin sharing widget**: `backend/src/admin/extensions/components/ShareWithClient/index.js` (updated to use new endpoint)
  - **Frontend token handling**: `frontend/pages/article/[slug].js` (client-side tokenized URL detection)
  - **SEO protection**: `frontend/components/seo.js` (robots directives, canonical URLs)
  - **Gallery compatibility**: `frontend/components/PhotoSwipeGallery.js` (full functionality in preview mode)
- **Security Features**: 
  - Environment-based URL generation (localhost/production)
  - Token-based access control with 12-character alphanumeric tokens
  - Complete SEO protection preventing search indexing
  - No static path generation for tokenized URLs (security by obscurity)
- **URL Format**: `https://www.silkytruth.com/article/{slug}~{token}`
- **AWS Amplify Compatibility**: Tokenized URLs handled entirely client-side, compatible with static export
- **Status**: ✅ Complete - Production ready with security fixes and AWS Amplify compatibility

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

### Local Development Database Setup
- **Issue**: Need production data type (PostgreSQL) locally for safe CMS development
- **Solution**: Set up local PostgreSQL database with imported production data
- **Locations**:
  - Local PostgreSQL config: `backend/.env`
  - Sync scripts: `backend/database-sync/main-workflow/`
  - Quick sync: `backend/database-sync/sync-all.sh`
- **Status**: ✅ Working - Local backend uses PostgreSQL with complete production data sync

### Local Image Proxy System
- **Issue**: Production images stored in S3 not accessible in local development
- **Solution**: Created image proxy that fetches S3 images and serves them locally
- **Locations**:
  - Proxy endpoint: `backend/src/api/image-proxy/`
  - Image sync scripts: `backend/database-sync/main-workflow/simple-image-update.js`, `backend/database-sync/main-workflow/sync-gallery-images.js`
  - Proxy URL format: `http://localhost:1337/api/image-proxy/[image-filename]`
- **Status**: ✅ Working - Local frontend shows production images via proxy

### Local CMS Image Display Fix
- **Issue**: Images not displaying in CMS admin panel locally (CSP blocking S3 URLs)
- **Solution**: Multiple steps required:
  1. Update all database URLs to use local proxy
  2. Set provider field to 'local' in database
  3. Update CSP to allow S3 domain
  4. Add middleware to rewrite S3 URLs
- **Implementation**:
  1. Run URL update script:
     ```bash
     cd backend && node database-sync/main-workflow/update-urls-to-proxy.js
     ```
  2. Update provider in database:
     ```bash
     PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres -c "UPDATE files SET provider = 'local' WHERE provider = 'aws-s3';"
     ```
  3. CSP config in `backend/config/middlewares.js` includes S3 domain
  4. Custom middleware at `backend/src/middlewares/rewrite-s3-urls.js`
  5. Rebuild admin panel: `npm run build`
- **Status**: ✅ Working - CMS displays images properly in local development

## Database Sync Process

### Syncing Production Data to Local Development

When working on CMS features, you may need production data locally. Use the following process:

#### Prerequisites
- SSH access to EC2 instance with key: `~/.ssh/ec2-strapi-key-pair.pem`
- Local backend running at `http://localhost:1337`
- Local PostgreSQL database configured

#### Recommended: Database Export/Import + Gallery Sync
```bash
cd backend

# 1. Complete database sync (preserves everything)
bash database-sync/db-sync.sh

# 2. Sync all gallery images (if needed)
node database-sync/main-workflow/sync-all-galleries.js

# 3. Fix image display in CMS admin panel
node database-sync/main-workflow/update-urls-to-proxy.js
PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres -c "UPDATE files SET provider = 'local' WHERE provider = 'aws-s3';"
npm run build
```

This method:
- Exports entire production PostgreSQL database
- Imports complete data with all relationships intact
- Preserves focal points, gallery images, file metadata
- Dynamically syncs all article galleries using slug-based matching
- Uses image proxy system for S3-hosted media
- No duplicates or missing data
- 100% identical to production

#### Fallback: API-Based Sync (Deprecated)
⚠️ Use only if database sync fails:
```bash
cd backend

# 1. Enable API permissions
node database-sync/main-workflow/configure-permissions.js

# 2. Sync content (may have issues with galleries/focal points)
node database-sync/main-workflow/full-sync.js

# 3. Sync all galleries with new comprehensive script
node database-sync/main-workflow/sync-all-galleries.js

# 4. Secure API
node database-sync/main-workflow/cleanup-permissions.js
```

For detailed documentation, see: `backend/database-sync/DATABASE_SYNC_GUIDE.md`

#### Manual Database Sync (Alternative)
For full database sync including user accounts and permissions:

```bash
# 1. Export production PostgreSQL database
ssh -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130
PGPASSWORD='TmiY7bdr22WCB7N' pg_dump -h photography-blog-db.ckmckf7lbra5.us-west-2.rds.amazonaws.com -p 5432 -U postgres -d strapi --clean --if-exists > /tmp/production_db_backup.sql

# 2. Transfer to local machine
scp -i ~/.ssh/ec2-strapi-key-pair.pem ubuntu@44.246.84.130:/tmp/production_db_backup.sql /tmp/

# 3. Set up local PostgreSQL 
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER strapi WITH PASSWORD 'localpass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO strapi;"

# 4. Import database (use existing 'postgres' database)
PGPASSWORD='localpass' psql -h localhost -U strapi -d postgres < /tmp/production_db_backup.sql
```

#### Current Content Status (Post-Gallery Sync)
All articles now have complete galleries synced:
- **Oregon Country Fair 🍑 2024**: 198 gallery items ✅
- **Basswitch 6**: 56 gallery items ✅
- **Basswitch 7**: 42 gallery items ✅
- **Mixtape Meetup**: 23 gallery items ✅
- **The One Motorcycle Show 2025**: 9 gallery items ✅
- **🍩 Donuts and Drip 14 💦**: 24 gallery items ✅

Additional content includes:
- Categories (5 items): food, nature, news, story, tech
- Writers (2 items): David Doe, Sarah Baker
- Global settings (site metadata, favicon)
- Homepage content (hero section, SEO)

**Important Notes:**
- Images are served via local proxy from S3 (not downloaded locally)
- Gallery sync uses slug-based matching to avoid hardcoded IDs
- All content relations (author, categories, galleries) are properly mapped
- Local database uses PostgreSQL matching production environment
- Image proxy system provides seamless access to S3-hosted media
- API permissions are temporarily enabled during import, then secured afterward

## Architecture Verification ✅

### **Production Architecture Analysis (December 2025)**

Your setup has been verified against official documentation using Context7 MCP servers for:
- **Next.js v11**: Static export, client-side data fetching, AWS Amplify deployment
- **AWS Amplify**: Static site hosting, build configuration, environment variables  
- **Strapi v4.2.0**: RESTful APIs, content management, production deployment

### **Best Practices Compliance**

**✅ Next.js Best Practices:**
- Static export for hosting compatibility
- `fallback: false` for AWS Amplify static export
- Client-side data fetching for dynamic content
- Environment-based API URL configuration
- Image optimization for static export

**✅ AWS Amplify Best Practices:**
- Static site generation with `output: "export"`
- Correct build artifacts in `/frontend/out`
- Proper environment variable usage
- CSP headers for API communication
- Monorepo configuration in `amplify.yml`

**✅ Strapi Best Practices:**
- Environment variable usage for sensitive data
- RESTful API design patterns
- Content-type schema organization
- Custom controller implementation
- Production deployment configuration

### **Performance Verification**

**Confirmed Dynamic Content Flow:**
1. **CMS Change** → Strapi API updated
2. **Page Load** → `useEffect` triggers API call
3. **Data Fetch** → Fresh content from `https://api.silkytruth.com`
4. **UI Update** → New content displays immediately
5. **No Redeployment** → AWS Amplify build unchanged

## Context7 MCP Documentation Access

### Available Documentation Libraries

The project has Context7 MCP server integrated, providing real-time access to comprehensive documentation for all libraries in use:

#### **Core Framework Documentation**
- **Next.js v11**: Static generation (`getStaticProps`, `getStaticPaths`), API routes, image optimization, deployment configurations, AWS Amplify integration
- **Strapi v4.2.0**: Content types, API endpoints, admin panel customization, plugin development, deployment configurations
- **React 17**: Component lifecycle, hooks, context API, performance optimization, concurrent features

#### **UI/Animation Libraries**
- **Framer Motion v6.5.1**: Animation APIs, gesture handling, layout animations, performance optimization techniques
- **PhotoSwipe v5.4.4**: Gallery configuration, event handling, customization options, responsive image display
- **React Markdown v4.2.2**: Markdown parsing, custom renderers, plugin architecture, security considerations

#### **Database & Infrastructure**
- **PostgreSQL**: Database configuration, build system options, time zone handling, SQL feature compliance, administration commands
- **AWS Amplify**: Static site hosting, Next.js build configurations, environment variables, CI/CD pipeline setup

### Using Context7 Tools

When you need library-specific documentation, use these MCP tools:

```javascript
// 1. First resolve the library ID
mcp__context7__resolve-library-id({
  libraryName: "Next.js"  // or "Strapi", "React", etc.
})

// 2. Then fetch specific documentation
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/vercel/next.js",  // from step 1
  topic: "static generation deployment",           // optional focus
  tokens: 8000                                    // optional token limit
})
```

### Key Benefits
- **Always Up-to-Date**: Documentation is fetched fresh from indexed repositories
- **Context-Aware**: Can focus on specific topics relevant to current work
- **Comprehensive**: Covers all major libraries used in the project
- **On-Demand**: No local storage needed, documentation accessed when required

This eliminates the need to maintain local documentation copies and ensures access to the latest library features and best practices.

## Troubleshooting

### Report Modal Issues

**False Positives on "Already Reported":**
- **Symptoms**: Getting sleepy cat message for images never reported
- **Cause**: Session storage conflicts or PhotoSwipe current slide tracking issues
- **Solution**: Visit `http://localhost:3000/reset-sessions.html` to clear session storage
- **Debug**: Check browser console for detailed logging of image IDs and session state

**Mobile Layout Overflow:**
- **Symptoms**: Buttons extending beyond modal boundaries on mobile
- **Cause**: Canvas width constraints or container sizing issues
- **Solution**: Ensure `.step2-option-button` has `width: auto` in mobile CSS
- **Debug**: Inspect element to verify canvas width matches container

**Background Scrolling:**
- **Symptoms**: Page scrolls behind open modal or PhotoSwipe
- **Cause**: Missing scroll prevention CSS
- **Solution**: Verify `body:has(.report-modal-overlay)` and `.pswp--open` CSS rules are applied
- **Debug**: Check if `overflow: hidden` is being applied to body element

**Rough.js Canvas Not Rendering:**
- **Symptoms**: Blank or broken modal backgrounds
- **Cause**: SSR issues or device pixel ratio problems
- **Solution**: Component includes SSR protection and DPR handling
- **Debug**: Check browser console for canvas-related errors

### PhotoSwipe Integration Issues

**Current Slide Tracking:**
- **Issue**: Report button sends wrong image ID
- **Solution**: Uses PhotoSwipe `change` event for reliable tracking
- **Debug**: Console shows detailed slide change logs with image IDs

## Deployment Notification Rule

**IMPORTANT**: Upon completing any changes to the codebase, always inform the user about deployment requirements.

### **Deployment Process**

**Frontend Deployment (AWS Amplify):**
- **Trigger**: `git push origin master`
- **Automatic**: AWS Amplify builds and deploys automatically
- **Build Time**: ~3-5 minutes
- **Verification**: Check https://www.silkytruth.com after deployment

**Backend Deployment (AWS EC2):**
- **Trigger**: Manual deployment to EC2 instance
- **Process**: SSH to EC2, pull changes, restart services
- **Database**: Automatic via AWS RDS (no action needed)
- **Verification**: Check https://api.silkytruth.com/admin

**Critical Files Requiring Deployment:**
- **Frontend Changes**: Any file in `/frontend/` → AWS Amplify deployment
- **Backend Changes**: Any file in `/backend/` → EC2 manual deployment  
- **Database Schema**: Requires backend restart + potential migration
- **Environment Variables**: Update in AWS Console before deployment

### **Security Considerations**
- **Never commit credentials** - Use environment variables
- **Rotate exposed credentials immediately** if GitGuardian alerts
- **Test locally first** before production deployment
- **Monitor logs** for deployment issues

Refer to SECURITY.md for credential management and emergency procedures.

---

**Developer**: Nikita Kozlov <Nikita@Stroika.io>  
**Project**: Photography Blog Development Documentation