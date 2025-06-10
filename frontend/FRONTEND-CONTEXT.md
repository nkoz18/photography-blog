# Frontend Context - Photography Blog Next.js Application

## Overview
This is a Next.js v11.0.0 static site generator frontend for a photography blog. It connects to a Strapi CMS backend and is deployed on AWS Amplify. The application features advanced image galleries, dark mode support, and creative interactive elements.

## Technology Stack

### Core Technologies
- **Framework**: Next.js v11.0.0
- **UI Library**: React 17.0.2
- **Build Type**: Static Site Generation (SSG) with `next export`
- **Deployment**: AWS Amplify

### Styling & UI
- **CSS Framework**: UIKit 3.7.1
- **Custom Styling**: CSS with CSS variables for theming
- **Font Stack**:
  - Logo: Barriecito (Google Fonts)
  - Headings: Kirang Haerang (Google Fonts)
  - Body: IBM Plex Mono (Google Fonts)

### Key Dependencies
- **framer-motion**: Animation library for smooth UI transitions
- **photoswipe**: Advanced image gallery lightbox
- **react-photoswipe-gallery**: React wrapper for PhotoSwipe
- **react-responsive-masonry**: Masonry grid layouts (available but not actively used)
- **react-markdown**: Markdown rendering for article content
- **moment**: Date formatting
- **qs**: Query string parsing for API calls
- **konami**: Konami code detection for easter egg
- **jszip**: File compression for download all functionality

## Architecture & Data Flow

### Build Strategy
The frontend uses a hybrid approach combining static generation with client-side data fetching:

1. **Static Generation** (Build Time):
   - Pre-renders all pages using `getStaticProps` and `getStaticPaths`
   - Fetches data from Strapi backend during build
   - Generates static HTML files

2. **Client-Side Fetching** (Runtime):
   - When `isStaticExport` is true, components fetch fresh data
   - Ensures content stays up-to-date without rebuilding
   - Uses React hooks for data management

### Environment Configuration
```bash
# Development with local backend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev

# Development with cloud backend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run dev

# Production build
npm run build && npm run export
```

## Page Structure

### 1. Homepage (`pages/index.js`)
- **Path**: `/`
- **Data**: Articles, categories, homepage content
- **Features**:
  - Hero section from CMS
  - Article grid with asymmetric layout
  - Category navigation
  - SEO metadata from global settings
  - Random decorative accents on hover (left/right/center SVGs)

### 2. Article Pages (`pages/article/[slug].js`)
- **Path**: `/article/[slug]`
- **Dynamic Routes**: Generated from all article slugs
- **Features**:
  - Full article content with rich text
  - Image galleries (legacy or PhotoSwipe)
  - Category links
  - Author information displayed below title
  - Client-side data refresh
  - Author name with subtle styling (IBM Plex Mono, 70% opacity)

### 3. Category Pages (`pages/category/[slug].js`)
- **Path**: `/category/[slug]`
- **Dynamic Routes**: Generated from all category slugs
- **Features**:
  - Filtered article list by category
  - Same grid layout as homepage
  - Category-specific SEO

## Component Architecture

### Layout Components

#### Layout (`components/layout.js`)
- **Purpose**: Main layout wrapper with sticky footer
- **Features**:
  - Flexbox-based sticky footer
  - Dark mode class application
  - Children wrapper with consistent spacing

#### Navigation (`components/nav.js`)
- **Purpose**: Responsive navigation header
- **Features**:
  - Sticky positioning
  - Mobile hamburger menu with random SVG icons
  - Close button uses x.svg (consistent with lightbox)
  - Category links
  - Dark mode toggle integration
  - Smooth slide animations

#### Footer (`components/footer.js`)
- **Purpose**: Footer with social media links
- **Features**:
  - Custom SVG social icons (Instagram, TikTok, YouTube)
  - Hover effects with opacity transitions
  - Dark mode support with icon inversion
  - 40x40px icon size with scale animation on hover

### Content Components

#### Articles (`components/articles.js`)
- **Purpose**: Article grid display
- **Layout**:
  - Desktop: 1/5 left column, 4/5 right grid
  - Mobile: Single column
  - Right grid: 3 columns on desktop, responsive on smaller screens
- **Features**:
  - Featured article in left column
  - Remaining articles in right grid
  - Responsive breakpoints

#### Card (`components/card.js`)
- **Purpose**: Article preview card
- **Features**:
  - Responsive image with focal point support
  - Title and description
  - Category tags with links
  - Dark mode adaptation

#### Image (`components/image.js`)
- **Purpose**: Advanced image loading component
- **Features**:
  - Focal point support via CSS object-position
  - Loading states with GIF loader only (no text)
  - Error handling with retry logic (up to 3 attempts)
  - Exponential backoff for retries
  - Fallback to default image on persistent failure
  - Source URL validation

### Gallery Components

#### Gallery (`components/gallery.js`) - Legacy
- **Purpose**: UIKit-based lightbox gallery
- **Features**:
  - Grid layout
  - UIKit lightbox integration
  - Caption support

#### PhotoSwipeGallery (`components/PhotoSwipeGallery.js`)
- **Purpose**: Modern masonry gallery with lightbox
- **Features**:
  - CSS-based masonry layout (3/2/1 columns responsive)
  - PhotoSwipe v5 integration with report and download buttons
  - Framer Motion animations: fade-in, slide-up, staggered timing
  - Random decorative dividers between sections
  - Full-screen lightbox with custom UI icons:
    - Loupe icon for zoom (replaced magnifying glass)
    - X icon for close
    - Custom download, prev, next icons
    - Report button for flagging inappropriate content
  - Navigation arrows hidden on mobile/touch devices
  - Caption and alt text support
  - Smooth hover animations (1.02x scale)

### SEO Component (`components/seo.js`)
- **Purpose**: Meta tag management
- **Features**:
  - Dynamic title generation
  - Open Graph tags
  - Twitter Card tags
  - Canonical URLs
  - Article-specific metadata

## Custom Features

### 1. Konami Code Easter Egg (`components/KonamiEasterEgg.js`)
**Activation**: ↑↑↓↓←→←→BA (keyboard) or custom mobile gestures

**Features**:
- **Characters**: 6 animated characters (Bulrog, Gman, Gon, Gucci, Mantis, Silky)
- **Animation**: Horizontal movement with vertical bobbing
- **Audio**: Character-specific sound effects
- **Mobile Support**: 
  - Swipe sequence: up, up, down, down, left, right, left, right
  - Tap sequence: two taps (B, A)
- **Implementation**:
  - React Portal for rendering outside main DOM
  - Dynamic imports for performance
  - Cleanup on component unmount

### 2. Dark Mode System
**Hook**: `lib/useDarkMode.js`

**Features**:
- **State Management**: React hook with localStorage persistence
- **System Detection**: Respects OS dark mode preference
- **CSS Implementation**:
  - CSS variables for theme colors
  - Smooth transitions (0.3s)
  - Image adjustments (grayscale 20%, opacity 95% in dark mode)
- **Toggle**: Integrated in navigation component

### 3. Random Asset System (`lib/randomAssets.js`)
**Purpose**: Add visual variety to UI elements

**Assets**:
- **Menu Icons**: 6 custom SVGs (cone, fries, hamburger, poison, syringe, zippo)
- **Gallery Dividers**: 4 decorative SVG patterns
- **UI Icons**: 
  - Navigation: x.svg, loupe.svg, download.svg, prev.svg, next.svg
  - Social: social_instagram.svg, social_tik_tok.svg, social_youtube.svg
- **Decorative Accents**: Multiple SVGs for left/right/center positions
- **Implementation**: Random selection on component mount

## API Integration (`lib/api.js`)

### Configuration
```javascript
// API URLs
const LOCAL_API = "http://127.0.0.1:1337"
const CLOUD_API = "https://api.silkytruth.com"

// Selection based on environment
const API_URL = process.env.USE_CLOUD_BACKEND === 'true' ? CLOUD_API : LOCAL_API
```

### Core Functions

#### `fetchAPI(path, urlParamsObject = {})`
- Constructs full API URLs
- Handles query parameters with `qs`
- Returns parsed JSON responses

#### `getArticles()`
- Fetches all articles with populated relations
- Includes authors and categories

#### `getArticle(slug)`
- Fetches single article by slug
- Populates all relations and gallery items

#### `getCategories()`
- Fetches all categories

#### `getGlobalData()`
- Fetches site-wide settings
- Includes default SEO and favicon

### Media Handling (`lib/media.js`)
```javascript
getStrapiMedia(media) {
  // Handles both relative and absolute URLs
  // Constructs full URLs for S3-hosted images
  // Returns null for missing media
}
```

## Build & Deployment

### Next.js Configuration (`next.config.js`)
```javascript
{
  exportPathMap: async function() {
    // Custom path generation for static export
  },
  images: {
    loader: "default",
    domains: ["localhost", "api.silkytruth.com", "silky-strapi-blog.s3.amazonaws.com"]
  }
}
```

### Amplify Configuration (`amplify.yml`)
- **Frontend Build**:
  ```yaml
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci --legacy-peer-deps
    build:
      commands:
        - NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run deploy
  ```
- **Artifacts**: `frontend/out/**/*`
- **Cache**: `frontend/node_modules/**/*`

## Performance Optimizations

### 1. Static Generation
- Pre-rendered HTML for instant page loads
- SEO-friendly content available at build time

### 2. Code Splitting
- Dynamic imports for heavy components (PhotoSwipe, Easter Egg)
- Reduces initial bundle size

### 3. Image Optimization
- Lazy loading for images
- Multiple responsive sizes
- Retry logic for failed loads

### 4. Client-Side Data Fetching
- Only fetches when viewing static export
- Prevents stale content without full rebuilds

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 960px
- Desktop: > 960px
- Large Desktop: > 1200px

### Mobile Adaptations
- Single column article grid
- Slide-down navigation menu
- Touch-friendly gallery controls
- Adjusted font sizes

## Security & Best Practices

### Content Security
- CSP headers configured in backend
- Whitelisted domains for images
- No inline scripts

### Error Handling
- Graceful fallbacks for missing data
- Default images for failed loads
- Try-catch blocks in data fetching

### Accessibility
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Alt text for all images

## Development Workflow

### Local Development
```bash
cd frontend
npm install --legacy-peer-deps

# Start with local backend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev

# Start with cloud backend
NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=true npm run dev
```

### Production Build
```bash
npm run build    # Build Next.js app
npm run export   # Generate static files
npm run deploy   # Build + export combined
```

### Code Quality
```bash
npm run lint     # Run ESLint
npm run lint:fix # Auto-fix linting issues
```

## Key Integration Points with Backend

### 1. Content Structure
- Mirrors Strapi content types (Article, Category, Writer, Global, Homepage)
- Handles component-based content (galleries, SEO)

### 2. Image Management
- Supports focal points from backend
- Handles S3-hosted media
- Gallery integration with batch uploads

### 3. Dynamic Features
- Real-time content updates via client-side fetching
- Preserves static benefits while staying current

## Notes for Developers

1. **Always use `--legacy-peer-deps`** due to dependency conflicts
2. **OpenSSL legacy provider** required for Node.js compatibility
3. **Test both backends** during development
4. **Focal points** are percentage-based (0-100)
5. **Easter egg** should not interfere with normal usage
6. **Dark mode** preference persists across sessions
7. **Static export** means no server-side features (use client-side instead)

This frontend provides a performant, feature-rich photography blog experience with creative touches and modern web standards.