console.log('NEXT CONFIG says NODE_ENV =', process.env.NODE_ENV);
console.log('Will use:', process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:1337' 
  : 'http://34.220.121.179:1337'
);

const nextConfig = {
  images: {
    loader: "default",
    domains: ["localhost", "127.0.0.1", "s3.amazonaws.com", "photography-blog-images.s3.us-west-2.amazonaws.com"],
  },
  swcMinify: false,
  env: {
    NEXT_PUBLIC_STRAPI_API_URL: process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:1337'
      : 'http://34.220.121.179:1337',
    API_URL: process.env.NODE_ENV === 'development' 
      ? 'http://127.0.0.1:1337'
      : 'http://34.220.121.179:1337',
  },
}

module.exports = nextConfig;