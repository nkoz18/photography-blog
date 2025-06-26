module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Only rewrite URLs in development environment
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    
    // Only process JSON responses in development
    if (isDevelopment && ctx.response.type && ctx.response.type.includes('json') && ctx.body) {
      // Convert body to string to perform replacements
      let bodyStr = JSON.stringify(ctx.body);
      
      // Replace S3 URLs with local proxy URLs
      if (bodyStr.includes('photography-blog-images.s3')) {
        // Use dynamic host and port from environment
        const host = process.env.HOST || '0.0.0.0';
        const port = process.env.PORT || 1337;
        const proxyBaseUrl = host === '0.0.0.0' ? `http://localhost:${port}` : `http://${host}:${port}`;
        
        // Replace all S3 URLs with proxy URLs
        bodyStr = bodyStr.replace(
          /https:\/\/photography-blog-images\.s3\.us-west-2\.amazonaws\.com\//g,
          `${proxyBaseUrl}/api/image-proxy/`
        );
        
        // Parse back to object
        ctx.body = JSON.parse(bodyStr);
      }
    }
  };
};