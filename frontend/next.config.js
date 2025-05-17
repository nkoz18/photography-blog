const nextConfig = {
  images: {
    loader: "default",
    domains: [
      "localhost",
      "127.0.0.1",
      "s3.amazonaws.com",
      "photography-blog-images.s3.us-west-2.amazonaws.com",
      "34.220.121.179",
      "www.silkytruth.com",
      "silkytruth.com",
    ],
    unoptimized: true, // Need this for next export
  },
  swcMinify: false,
  trailingSlash: true, // Helps with static export
  assetPrefix: "https://www.silkytruth.com", // Add asset prefix for production
  env: {
    NEXT_PUBLIC_STRAPI_API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "http://34.220.121.179:1337" // Changed back to HTTP
        : "http://127.0.0.1:1337",
    API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "http://34.220.121.179:1337" // Changed back to HTTP
        : "http://127.0.0.1:1337",
  },
  // Remove exportPathMap causing issues
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination:
          process.env.USE_CLOUD_BACKEND === "true"
            ? "http://34.220.121.179:1337/uploads/:path*" // Changed back to HTTP
            : "http://127.0.0.1:1337/uploads/:path*",
      },
      {
        source: "/api/:path*",
        destination:
          process.env.USE_CLOUD_BACKEND === "true"
            ? "http://34.220.121.179:1337/api/:path*" // Changed back to HTTP
            : "http://127.0.0.1:1337/api/:path*",
      },
    ]
  },
}

module.exports = nextConfig
