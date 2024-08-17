/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    loader: "default",
    domains: ["localhost", "s3.amazonaws.com", "photography-blog-images.s3.us-west-2.amazonaws.com"],
  },
  swcMinify: false,
  env: {
    API_URL: 'http://34.220.121.179:1337', // Correct API URL
  },
}

module.exports = nextConfig;
