# Stop on any error
$ErrorActionPreference = "Stop"

Write-Output "Clearing Strapi cache..."
# Remove cache directories
if (Test-Path ".cache") {
    Remove-Item -Recurse -Force ".cache"
}

if (Test-Path ".tmp") {
    Remove-Item -Recurse -Force ".tmp"
}

if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}

Write-Output "Building Strapi admin panel..."
yarn build
# Or if using npm
# npm run build

Write-Output "Starting Strapi in development mode..."
yarn develop
# Or if using npm
# npm run develop 