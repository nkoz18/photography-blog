module.exports = ({ env }) => {
  // Use local provider for development
  const isLocal = env("NODE_ENV") === "development" && !env("AWS_ACCESS_KEY_ID");
  
  const uploadConfig = isLocal
    ? {
        provider: "local",
        providerOptions: {
          sizeLimit: 1000 * 1024 * 1024, // 1GB
        },
      }
    : {
        provider: "aws-s3",
        providerOptions: {
          accessKeyId: env("AWS_ACCESS_KEY_ID"),
          secretAccessKey: env("AWS_ACCESS_SECRET"),
          region: env("AWS_REGION"),
          params: {
            Bucket: env("AWS_BUCKET_NAME"),
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
        sizeLimit: 1000 * 1024 * 1024, // 1GB
      };

  return {
    upload: {
      config: uploadConfig,
    },
    "users-permissions": {
      config: {
        jwtSecret: env("JWT_SECRET"),
        jwt: {
          expiresIn: "7d",
        },
      },
    },
  };
};
