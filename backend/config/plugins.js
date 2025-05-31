module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "local",
      sizeLimit: 1000 * 1024 * 1024, // 1GB
    },
  },
  "users-permissions": {
    config: {
      jwtSecret: env("JWT_SECRET"),
      jwt: {
        expiresIn: "7d",
      },
    },
  },
});
