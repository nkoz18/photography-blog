module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    // Only process JSON responses
    if (ctx.response.type && ctx.response.type.includes('json') && ctx.body) {
      // Convert body to string to perform replacements
      let bodyStr = JSON.stringify(ctx.body);
      
      // Replace S3 URLs with local proxy URLs
      if (bodyStr.includes('photography-blog-images.s3')) {
        // Replace all S3 URLs with proxy URLs
        bodyStr = bodyStr.replace(
          /https:\/\/photography-blog-images\.s3\.us-west-2\.amazonaws\.com\//g,
          'http://localhost:1337/api/image-proxy/'
        );
        
        // Parse back to object
        ctx.body = JSON.parse(bodyStr);
      }
    }
  };
};