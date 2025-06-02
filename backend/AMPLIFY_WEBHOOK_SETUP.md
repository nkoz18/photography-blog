# AWS Amplify Webhook Setup

This guide explains how to set up automatic frontend rebuilds when content changes in Strapi.

## Overview

When you update content in the Strapi CMS, the frontend needs to be rebuilt to reflect those changes. This is automated using webhooks that trigger AWS Amplify to rebuild and redeploy your site.

## Features

- Automatic frontend rebuilds when content changes
- Rate limiting (max 1 rebuild per 5 minutes) to prevent excessive builds
- Triggers on article/category create, update, and delete
- Only rebuilds for published content changes

## Setup Instructions

### 1. Get Your AWS Amplify Webhook URL

1. Go to AWS Amplify Console
2. Select your app
3. Navigate to "Build settings" 
4. Scroll to "Incoming webhooks"
5. Click "Create webhook"
6. Name it "Strapi Content Update"
7. Copy the webhook URL

### 2. Configure Strapi Backend

Add the webhook URL to your backend environment variables:

```bash
# In your .env file or server environment
AMPLIFY_WEBHOOK_URL=https://webhooks.amplify.region.amazonaws.com/prod/webhooks/...
```

### 3. Deploy Backend Changes

```bash
# SSH into your EC2 server
ssh -i "path/to/your-key.pem" ubuntu@your-server-ip

# Navigate to backend
cd /var/www/photography-blog/backend

# Pull latest changes
git pull

# Install dependencies (if any new ones)
npm install

# Build Strapi
npm run build

# Restart the backend
pm2 restart backend
```

### 4. Test the Integration

1. Make a change to an article in Strapi Admin
2. Check the backend logs: `pm2 logs backend`
3. You should see: "Triggering Amplify rebuild: Article updated"
4. Check AWS Amplify console - a new build should start
5. After build completes (5-10 min), your changes will be live

## How It Works

1. **Lifecycle Hooks**: Strapi lifecycle hooks detect content changes
2. **Rate Limiting**: Prevents more than 1 rebuild per 5 minutes
3. **Webhook Trigger**: Sends POST request to Amplify webhook URL
4. **Amplify Build**: Amplify pulls latest from git and rebuilds the frontend
5. **Deploy**: New static site is deployed automatically

## Troubleshooting

### Changes not appearing?

1. Check if webhook URL is configured: `pm2 logs backend | grep AMPLIFY_WEBHOOK_URL`
2. Verify rate limiting isn't blocking: Check for "Skipping Amplify rebuild" in logs
3. Check Amplify build status in AWS console
4. Ensure article is published (draft articles won't appear)

### Too many builds?

The 5-minute rate limit prevents excessive builds. To adjust:
- Edit `/backend/src/utils/amplify-rebuild.js`
- Change `MIN_INTERVAL` value (in milliseconds)

### Manual rebuild

If needed, you can manually trigger a rebuild:
1. Go to AWS Amplify Console
2. Click "Redeploy this version"

## Notes

- Build time is typically 5-10 minutes
- Only published articles appear on the frontend
- Gallery changes trigger rebuilds too
- The system handles batch updates intelligently with rate limiting