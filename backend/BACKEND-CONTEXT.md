# Backend Context - Photography Blog Strapi CMS

## Overview
This is a Strapi v4.2.0 headless CMS backend that powers a photography blog. It runs on an AWS EC2 instance and provides REST APIs for content management with custom features specifically designed for photography and image management.

## Technology Stack

### Core Technologies
- **Framework**: Strapi v4.2.0 (Node.js-based headless CMS)
- **Runtime**: Node.js
- **Package Manager**: npm

### Database
- **Development**: PostgreSQL (matching production type)
- **Production**: PostgreSQL on AWS RDS
  - SSL enabled for secure connections
  - Extended connection timeout for stability

### Storage
- **Development**: Local file system
- **Production**: AWS S3 (configured but currently using local storage)
  - Custom S3 domains whitelisted in CSP

### Key Dependencies
- **GraphQL**: Optional GraphQL API support
- **i18n**: Internationalization plugin
- **cross-env**: Cross-platform environment variable support
- **strapi-plugin-populate-deep**: Deep population of relations

## Architecture & Structure

### Content Types (Models)

#### 1. Article (Collection Type)
**Location**: `src/api/article/`
- **Fields**:
  - title (string, required)
  - description (text)
  - content (richtext)
  - slug (unique identifier)
  - categories (many-to-many relation)
  - image (single media)
  - author (many-to-one relation with Writer)
  - gallery (component: sections.image-gallery)
- **Custom Features**:
  - Batch image upload endpoint
  - Gallery management system

#### 2. Category (Collection Type)
**Location**: `src/api/category/`
- **Fields**:
  - name (string, required)
  - slug (unique identifier)
  - articles (many-to-many relation)

#### 3. Writer (Collection Type)
**Location**: `src/api/writer/`
- **Fields**:
  - name (string)
  - picture (single media)
  - articles (one-to-many relation)
  - email (email field)

#### 4. Global (Single Type)
**Location**: `src/api/global/`
- **Purpose**: Site-wide settings
- **Fields**:
  - siteName
  - defaultSeo (component)
  - favicon (single media)

#### 5. Homepage (Single Type)
**Location**: `src/api/homepage/`
- **Purpose**: Homepage-specific content and configuration
- **Fields**: Custom content sections and SEO

### Component System

#### Gallery Components
- **sections.image-gallery**: Container for gallery items
- **sections.gallery-item**: Individual gallery item with:
  - image (media)
  - caption (string)
  - alt_text (string)
  - display_size (enumeration)

#### Other Components
- **sections.hero**: Hero section component
- **shared.seo**: SEO metadata component

## Custom Features & Extensions

### 1. Batch Image Upload System
**Location**: `src/api/article/controllers/article.js`
**Endpoint**: `POST /api/articles/:id/batch-upload`

**Functionality**:
- Accepts multiple image files in a single request
- Automatically creates gallery items for each uploaded image
- Adds new items to existing article gallery (preserves existing items)
- Robust error handling and validation
- Returns detailed upload results

**Implementation Details**:
```javascript
// Custom route configuration
{
  method: 'POST',
  path: '/articles/:id/batch-upload',
  handler: 'article.batchUpload',
  config: {
    policies: [],
    middlewares: []
  }
}
```

### 2. Image Focal Point System
**Location**: `src/extensions/upload/strapi-server.js`

**Endpoints**:
- `POST /upload/updateFocalPoint/:id` - Updates focal point coordinates
- `GET /upload/fileDetails/:id` - Retrieves file details with focal point

**Features**:
- Stores focal points as percentages (x, y) in `provider_metadata.focalPoint`
- Automatically includes focal point data in all file responses
- Admin-only access control
- Persistent storage in file metadata

### 3. Admin UI Customizations
**Location**: `src/admin/extensions/`

**Custom Components**:
1. **BatchImageUpload** (`components/BatchImageUpload/index.js`)
   - Drag-and-drop interface for bulk uploads
   - Progress tracking
   - Error handling with user feedback

2. **ImageFocalPoint** (`components/ImageFocalPoint/index.js`)
   - Visual focal point selector
   - Live preview
   - Percentage-based positioning

3. **GalleryThumbnails** (`components/GalleryThumbnails/index.js`)
   - Enhanced gallery visualization
   - Thumbnail previews
   - Reordering support

## Configuration

### Server Configuration (`config/server.js`)
- **Host**: 0.0.0.0 (allows external connections)
- **Port**: 1337
- **App Keys**: Security keys from environment
- **Webhooks**: Populate relations enabled

### API Configuration (`config/api.js`)
- **Response Limits**:
  - Default: 25 items
  - Maximum: 100 items
- **Features**:
  - Includes count in responses
  - Deep population support

### Middleware Configuration (`config/middlewares.js`)
- **Security**:
  - Custom CSP directives
  - S3 domains whitelisted
- **CORS**: Enabled for cross-origin requests
- **File Upload**:
  - Max file size: 1GB
  - Custom size limits per file type

### Database Configuration (`config/database.js`)
- **Development**:
  ```javascript
  client: 'postgres',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'strapi',
    password: 'localpass',
    ssl: false
  }
  ```
- **Production**:
  ```javascript
  client: 'postgres',
  ssl: { rejectUnauthorized: false },
  acquireConnectionTimeout: 600000
  ```

## Deployment & Infrastructure

### EC2 Deployment
- **Instance**: AWS EC2 (exact instance type not specified)
- **Access**: SSH key stored locally
- **Process Manager**: PM2 or systemd

### Deployment Script (`deploy.sh`)
**Steps**:
1. Git pull latest from master
2. Install dependencies
3. Build admin panel
4. Restart service via PM2/systemd

**Usage**:
```bash
ssh -i /path/to/key.pem ec2-user@instance-ip
cd /path/to/backend
./deploy.sh
```

### Environment Variables
Required in `.env`:

**Development:**
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=<comma-separated-keys>
API_TOKEN_SALT=<salt>
ADMIN_JWT_SECRET=<secret>
JWT_SECRET=<secret>
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=localpass
DATABASE_SSL_SELF=false
```

**Production:**
```
HOST=0.0.0.0
PORT=1337
APP_KEYS=<comma-separated-keys>
API_TOKEN_SALT=<salt>
ADMIN_JWT_SECRET=<secret>
JWT_SECRET=<secret>
DATABASE_CLIENT=postgres
DATABASE_HOST=<rds-endpoint>
DATABASE_PORT=5432
DATABASE_NAME=<db-name>
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>
DATABASE_SSL=true
AWS_ACCESS_KEY_ID=<key>
AWS_ACCESS_SECRET=<secret>
AWS_REGION=<region>
AWS_BUCKET=<bucket-name>
```

## Data Management

### Bootstrap & Seeding (`bootstrap.js`)
- Automatically imports seed data on first run
- Creates default categories, writers, articles
- Sets up public permissions
- Configures homepage and global settings

### Import Data Script (`import-data.js`)
- Standalone script for data import
- Handles media file uploads
- Creates relationships between entities
- Idempotent (safe to run multiple times)

## API Structure

### Standard REST Endpoints
- `/api/articles` - Article CRUD operations
- `/api/categories` - Category management
- `/api/writers` - Writer management
- `/api/global` - Global settings
- `/api/homepage` - Homepage content

### Custom Endpoints
- `/api/articles/:id/batch-upload` - Batch image upload
- `/upload/updateFocalPoint/:id` - Update focal point
- `/upload/fileDetails/:id` - Get file with focal point

### Authentication
- JWT-based authentication
- Admin panel uses separate JWT secret
- API tokens for programmatic access

## Development Workflow

### Local Development
```bash
npm install
npm run develop  # Starts at http://localhost:1337/admin
```

### Building for Production
```bash
npm run build   # Builds admin panel
npm run start   # Starts production server
```

### Database Management
- Migrations directory: `database/migrations/`
- Auto-migration in development
- Manual migration in production

## Key Business Logic

### Gallery Management
- Dynamic gallery creation if not exists
- Preserves existing gallery items
- Filters null/invalid items
- Maintains item ordering

### File Upload Enhancement
- Custom error messages
- Metadata enrichment
- Focal point persistence
- S3 integration ready

### Permission System
- Programmatic permission setup
- Public read access to content
- Admin-only write operations
- Scoped authentication for features

## Performance & Security

### Performance Optimizations
- Parallel file uploads
- Efficient database queries
- Caching headers configured
- Connection pooling for PostgreSQL

### Security Measures
- CSP headers configured
- CORS properly set up
- JWT authentication
- Environment-based secrets
- SQL injection prevention via ORM

## Monitoring & Maintenance

### Logging
- Console-based logging
- Error tracking in custom endpoints
- Upload progress tracking

### Health Checks
- Default Strapi health endpoint
- Database connection monitoring
- File system checks for uploads

## Notes for Developers

1. **Always use environment variables** for sensitive data
2. **Test batch uploads** with various file sizes
3. **Focal points** are percentage-based (0-100)
4. **Gallery items** can be reordered via admin UI
5. **Database backups** should be scheduled separately
6. **PM2 logs** contain runtime information
7. **Admin build** required after plugin changes

This backend serves as a robust, feature-rich CMS specifically tailored for photography blogging with advanced image management capabilities.