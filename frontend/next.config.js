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
    ],
    unoptimized: true, // Need this for next export
  },
  swcMinify: false,
  trailingSlash: true, // Helps with static export
  env: {
    NEXT_PUBLIC_STRAPI_API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "http://34.220.121.179:1337"
        : "http://127.0.0.1:1337",
    API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "http://34.220.121.179:1337"
        : "http://127.0.0.1:1337",
  },
  async rewrites() {
    // Only apply rewrites in development, not in static export
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://34.220.121.179:1337/api/:path*",
        },
        {
          source: "/uploads/:path*",
          destination: "http://34.220.121.179:1337/uploads/:path*",
        },
      ]
    }
    return []
  },
}

module.exports = nextConfig
