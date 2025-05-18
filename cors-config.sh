#!/bin/bash

# Script to set up CORS configuration on Strapi backend

# Create the middleware.js file with CORS configuration
cat > middleware.js << 'EOF'
module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: ['https://www.silkytruth.com', 'https://silkytruth.com', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept']
    }
  }
};
EOF

echo "CORS configuration file created: middleware.js"
echo ""
echo "Now please SSH into your EC2 server and run these commands:"
echo "-------------------------------------------------------------------------"
echo "cd ~/photography-blog/backend"
echo "mkdir -p config"
echo "# Copy the file you created (middleware.js) to the EC2 server"
echo "# scp middleware.js ubuntu@34.220.121.179:~/photography-blog/backend/config/"
echo "# Or create it manually with the same content"
echo "pm2 restart photography-blog"
echo "-------------------------------------------------------------------------"
echo ""
echo "After that, come back and run:"
echo "git add frontend/next.config.js frontend/components/image.js frontend/components/PhotoSwipeGallery.js amplify.yml"
echo "git commit -m \"Fix: Use direct connection with CORS support to fix image loading\""
echo "git push origin master" 