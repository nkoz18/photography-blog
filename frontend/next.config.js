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
  },
  swcMinify: false,
  env: {
    NEXT_PUBLIC_STRAPI_API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "/api"
        : "http://127.0.0.1:1337",
    API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "/api"
        : "http://127.0.0.1:1337",
  },
  async rewrites() {
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
  },
}

module.exports = nextConfig
