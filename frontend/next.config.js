/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    loader: "default",
    domains: ["localhost", "s3.amazonaws.com", "photography-blog-images.s3.us-west-2.amazonaws.com"],
  },
}

module.exports = nextConfig