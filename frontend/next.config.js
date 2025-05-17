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
  assetPrefix: "", // Remove asset prefix to allow relative URLs
  env: {
    NEXT_PUBLIC_STRAPI_API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "/api" // Use relative path to avoid mixed content
        : "http://127.0.0.1:1337",
    API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "/api" // Use relative path to avoid mixed content
        : "http://127.0.0.1:1337",
  },
  // Configure rewrites to handle API requests
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination:
          process.env.USE_CLOUD_BACKEND === "true"
            ? "http://34.220.121.179:1337/uploads/:path*" // This will be proxied by Next.js
            : "http://127.0.0.1:1337/uploads/:path*",
      },
      {
        source: "/api/:path*",
        destination:
          process.env.USE_CLOUD_BACKEND === "true"
            ? "http://34.220.121.179:1337/api/:path*" // This will be proxied by Next.js
            : "http://127.0.0.1:1337/api/:path*",
      },
    ]
  },
}

module.exports = nextConfig
