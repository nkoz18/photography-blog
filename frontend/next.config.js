/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    loader: "default",
    domains: ["localhost", "s3.amazonaws.com"],
  },
}

module.exports = nextConfig