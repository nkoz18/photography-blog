const https = require('https');
const http = require('http');

module.exports = {
  async proxy(ctx) {
    try {
      // Extract the path parameter (captures everything after /api/image-proxy/)
      const { path } = ctx.params;
      
      if (!path) {
        return ctx.badRequest("Image path is required");
      }
      
      // For wildcard params, the path may come as an array or string
      const fullPath = Array.isArray(path) ? path.join('/') : path;

      // Construct the S3 URL - check both possible buckets
      let s3Url;
      if (fullPath.includes('photography-blog-images.s3.us-west-2.amazonaws.com')) {
        // Already a full URL, use as-is
        s3Url = fullPath.startsWith('https://') ? fullPath : `https://${fullPath}`;
      } else {
        // Try the main images bucket first
        s3Url = `https://photography-blog-images.s3.us-west-2.amazonaws.com/${fullPath}`;
      }
      
      console.log(`Proxying image: ${s3Url}`);

      // Create a promise to handle the HTTP request
      const imageData = await new Promise((resolve, reject) => {
        const protocol = s3Url.startsWith('https:') ? https : http;
        
        const req = protocol.get(s3Url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to fetch image: ${res.statusCode}`));
            return;
          }

          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            resolve({
              data: Buffer.concat(chunks),
              contentType: res.headers['content-type'] || 'image/jpeg'
            });
          });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      // Set appropriate headers
      ctx.set('Content-Type', imageData.contentType);
      ctx.set('Cache-Control', 'public, max-age=3600');
      
      // Send the image data
      ctx.body = imageData.data;
      
    } catch (error) {
      console.error('Error proxying image:', error);
      return ctx.notFound('Image not found');
    }
  },
};