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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT