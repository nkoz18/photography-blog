module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "local",
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
