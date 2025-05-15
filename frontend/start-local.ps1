# PowerShell script to start the Next.js frontend with local backend
# This script sets environment variables and starts the development server

# Set environment variables for local development
$env:NODE_OPTIONS = "--openssl-legacy-provider"
$env:USE_CLOUD_BACKEND = "false"
$env:NEXT_PUBLIC_STRAPI_API_URL = "http://127.0.0.1:1337"
$env:API_URL = "http://127.0.0.1:1337"

Write-Host "Starting Next.js frontend with local backend configuration..."
Write-Host "Make sure the backend server is running at $env:NEXT_PUBLIC_STRAPI_API_URL"
Write-Host "Frontend will be available at http://localhost:3000"

# Start the Next.js development server
npm run dev 