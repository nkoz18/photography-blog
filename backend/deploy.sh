#!/bin/bash

# Backend Deployment Script
# This script pulls the latest changes and restarts the Strapi backend

echo "🚀 Starting backend deployment..."

# Change to backend directory
cd /home/nikita/code/photography-blog/backend

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the admin panel
echo "🔨 Building admin panel..."
npm run build

# Restart the backend service
echo "🔄 Restarting backend service..."
# Check if pm2 is being used
if pm2 list | grep -q "strapi"; then
    pm2 restart strapi
elif systemctl is-active --quiet strapi; then
    sudo systemctl restart strapi
else
    echo "⚠️  No running backend service found. Starting in production mode..."
    # You may want to use pm2 or systemd to manage the process
    # For now, we'll use pm2
    pm2 start npm --name "strapi" -- run start
fi

echo "✅ Backend deployment completed!"