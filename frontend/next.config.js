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
  // Explicitly setting output to export
  output: "export",
  env: {
    NEXT_PUBLIC_STRAPI_API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "https://cors-anywhere.herokuapp.com/http://34.220.121.179:1337" // Use CORS proxy
        : "http://127.0.0.1:1337",
    API_URL:
      process.env.USE_CLOUD_BACKEND === "true"
        ? "https://cors-anywhere.herokuapp.com/http://34.220.121.179:1337" // Use CORS proxy
        : "http://127.0.0.1:1337",
  },
  // We can't use rewrites with next export, so we're removing this
  // and will handle CORS and routing differently
  distDir: ".next",
}

module.exports = nextConfig
