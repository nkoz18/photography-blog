# Silky Truth Photography Blog

A modern photography blog built with Strapi CMS (backend) and Next.js (frontend). This project allows for efficient content management and a responsive, fast-loading frontend experience.

## Project Structure

This repository follows a monorepo structure with clear separation of concerns:

```
photography-blog/
├── backend/               # Strapi CMS backend
│   ├── config/            # Strapi configuration files
│   ├── src/               # Content types, APIs, and controllers
│   └── public/            # Public assets
│
├── frontend/              # Next.js frontend
│   ├── components/        # Reusable React components
│   ├── pages/             # Next.js pages and routes
│   ├── lib/               # Utility functions and API helpers
│   ├── public/            # Static assets
│   └── assets/            # Styles and images processed by Next.js
```

### Separation of Concerns

- **Backend (Strapi CMS)**
  - Manages content types, data storage, and API endpoints
  - Handles authentication and permissions
  - Manages media uploads (via AWS S3)
  - Provides a user-friendly admin interface

- **Frontend (Next.js)**
  - Consumes API data from Strapi
  - Handles page rendering and routing
  - Manages UI components and styling
  - Optimizes images and performance

## Image Focal Point System

The photography blog features a smart focal point system that ensures the most important parts of images remain visible regardless of how they're cropped on different devices.

### How Focal Points Work

1. **Setting Focal Points**: In the Strapi admin panel, content editors can set focal points on images by clicking on the most important area of the image using the ImageFocalPoint component.

2. **Data Storage**: Focal point coordinates are stored as percentages (x, y) in the image's `provider_metadata.focalPoint` field in the database:
   ```json
   "provider_metadata": {
     "focalPoint": {
       "x": 58.39,
       "y": 36.86
     }
   }
   ```

3. **API Integration**: When requesting images through the API, the `provider_metadata` field must be included in the query to retrieve focal point data:
   ```
   /api/articles?populate[image][fields][]=provider_metadata
   ```

4. **Frontend Rendering**: The Image component in the frontend automatically:
   - Detects focal point data in the image attributes
   - Applies CSS `object-position` styling with the focal point coordinates
   - Ensures the focal point stays visible when images are cropped

### Technical Implementation

- **Backend Storage**: Focal points are saved via the `/upload/updateFocalPoint/:id` endpoint
- **CSS Implementation**: The focal point is applied using:
  ```css
  object-fit: cover;
  object-position: 58.39% 36.86%; /* Using the focal point x and y values */
  ```
- **Responsive Design**: This ensures that on all screen sizes and aspect ratios, the most important part of the image remains visible

### Benefits

- Improved visual storytelling by keeping the subject in view
- Better responsive design without manual cropping of images
- Consistent user experience across devices

## Local Development Setup

### Prerequisites

- Node.js (version >=12.x.x <=16.x.x)
- npm (>=6.0.0) or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd photography-blog/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   # Then edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run develop
   # or
   yarn develop
   ```

The Strapi admin will be available at http://localhost:1337/admin

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd photography-blog/frontend
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   # For Windows PowerShell
   $env:NODE_OPTIONS="--openssl-legacy-provider"; $env:USE_CLOUD_BACKEND="false"; npm run dev
   
   # For Unix/Linux/Mac
   NODE_OPTIONS=--openssl-legacy-provider USE_CLOUD_BACKEND=false npm run dev
   ```

The frontend will be available at http://localhost:3000

## Environment Configurations

### Backend (.env)

The backend requires several environment variables for proper operation:

- `HOST` and `PORT`: Server configuration
- `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`: Security keys
- `DATABASE_CLIENT` and related: Database configuration
- `AWS_*`: AWS S3 configuration for file uploads

### Frontend

The frontend can be configured to use either a local or cloud backend:

- Local backend: `USE_CLOUD_BACKEND=false` (connects to http://127.0.0.1:1337)
- Cloud backend: `USE_CLOUD_BACKEND=true` (connects to a production instance)

## Deployment

### Backend Deployment

The Strapi backend is deployed on AWS EC2 with PostgreSQL RDS for the database and S3 for file storage.

### Frontend Deployment

The Next.js frontend is deployed on AWS Amplify, which automatically builds and deploys the site when changes are pushed to the main branch.

## Security Notes

- **Never commit sensitive environment variables** to the repository
- Use `.env.example` as a template for required variables
- The `.env` file is gitignored to prevent accidental commits
- AWS credentials should be managed securely

## Easter Eggs

### Konami Code Easter Egg

The website includes a hidden easter egg triggered by entering the Konami Code (↑ ↑ ↓ ↓ ← → ← → B A).

#### How It Works

1. **Activation**: When a user enters the Konami Code sequence on their keyboard, a character named "Silky" will appear and move across the screen while bobbing up and down.

2. **Technical Implementation**:
   - Uses the `konami` npm package to detect the key sequence
   - Implements smooth animation using `requestAnimationFrame` for both horizontal movement and vertical bobbing
   - Plays a custom sound effect when triggered
   - Supports fallback to SVG icon if the character image is unavailable
   - Works on both desktop and mobile (via touch sequence detection)

3. **Files**:
   - The implementation is in `frontend/components/KonamiEasterEgg.js`
   - Character image: `/public/easter-egg/images/silky.png`
   - Sound effect: `/public/easter-egg/sounds/silky.mp3`

#### Mobile Support

The easter egg can also be triggered on mobile devices by tapping the screen 10 times in quick succession (less than 1.5 seconds between taps).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT