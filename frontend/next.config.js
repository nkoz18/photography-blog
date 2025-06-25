const nextConfig = {
  images: {
    loader: "default",
    domains: [
      "localhost",
      "127.0.0.1",
      "192.168.1.27",
      "s3.amazonaws.com",
      "photography-blog-images.s3.us-west-2.amazonaws.com",
      "34.220.121.179",
      "www.silkytruth.com",
      "silkytruth.com",
      "api.silkytruth.com",
    ],
    unoptimized: true, // Keep for compatibility
  },
  swcMinify: false,
  trailingSlash: true,
  assetPrefix: "",
  // Use static export for Amplify compatibility, but implement client-side data fetching
  output: "export",
  env: {
    NEXT_PUBLIC_STRAPI_API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "https://api.silkytruth.com" // Secure connection to backend
        : process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://127.0.0.1:1337",
    API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "https://api.silkytruth.com" // Secure connection to backend
        : process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://127.0.0.1:1337",
  },
  // We can't use rewrites with next export, so we're removing this
  // and will handle CORS and routing differently
  distDir: ".next",
}

module.exports = nextConfig
