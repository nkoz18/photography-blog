module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: [
        "https://www.silkytruth.com",
        "https://silkytruth.com",
        "http://localhost:3000",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      headers: ["Content-Type", "Authorization", "Origin", "Accept"],
    },
  },
};
