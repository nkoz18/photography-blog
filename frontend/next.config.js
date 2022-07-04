/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  images: {
    loader: "default",
    domains: ["localhost", "http://18.237.233.149:1337/"],
  },
}

module.exports = nextConfig
