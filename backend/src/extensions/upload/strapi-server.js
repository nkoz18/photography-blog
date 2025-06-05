"use strict";

const fs = require("fs");
const { createReadStream } = require("fs");

/**
 * Strapi server file for the upload extension.
 * Adds focal point support for images.
 */
module.exports = (plugin) => {
  // Store original upload controller methods
  const originalUploadController = { ...plugin.controllers.upload };

  // Enhanced upload controller
  plugin.controllers.upload = {
    ...originalUploadController,

    // Enhanced upload method with better error handling
    async upload(ctx) {
      try {
        console.log("Custom upload handler called");
        console.log(
          "Request files:",
          ctx.request.files ? Object.keys(ctx.request.files).length : "None"
        );

        // Make sure body and files exist
        if (!ctx.request.files || Object.keys(ctx.request.files).length === 0) {
          console.log("No files in request");
          return ctx.badRequest("No files to upload");
        }

        console.log("Files in request:", Object.keys(ctx.request.files).length);

        // Call the original upload method
        const result = await originalUploadController.upload(ctx);
        console.log(
          "Upload completed successfully:",
          Array.isArray(result) ? result.length : "not an array"
        );
        return result;
      } catch (error) {
        console.error("Error in custom upload handler:", error);
        console.error("Error stack:", error.stack);
        return ctx.internalServerError(`Upload failed: ${error.message}`);
      }
    },

    async updateFocalPoint(ctx) {
      try {
        const { id } = ctx.params;
        const { focalPoint } = ctx.request.body;

        // Input validation
        if (!id) {
          return ctx.badRequest("File ID is required");
        }

        if (
          !focalPoint ||
          typeof focalPoint !== "object" ||
          focalPoint.x === undefined ||
          focalPoint.y === undefined
        ) {
          return ctx.badRequest("Valid focal point coordinates are required");
        }

        // Format the focal point data - Ensure it's stored as numbers
        const formattedFocalPoint = {
          x: parseFloat(focalPoint.x),
          y: parseFloat(focalPoint.y),
        };

        console.log(
          `Applying focal point: x=${formattedFocalPoint.x}%, y=${formattedFocalPoint.y}%`
        );

        try {
          // Use a direct database query for maximum flexibility
          const fileModel = strapi.query("plugin::upload.file");

          // Get the file
          const file = await fileModel.findOne({
            where: { id },
          });

          if (!file) {
            return ctx.notFound("File not found");
          }

          // Add the focal point to the file model
          // We'll store it in the "provider_metadata" field which is a JSON field that exists in the schema
          const providerMetadata = file.provider_metadata || {};
          providerMetadata.focalPoint = formattedFocalPoint;

          // Update the file with the focal point
          const updatedFile = await fileModel.update({
            where: { id },
            data: {
              provider_metadata: providerMetadata,
            },
          });

          console.log(
            "Focal point saved to provider_metadata:",
            providerMetadata
          );

          // Force the focal point into the response
          const responseWithFocalPoint = {
            ...updatedFile,
            focalPoint: formattedFocalPoint,
          };

          return responseWithFocalPoint;
        } catch (dbError) {
          console.error("Database error while updating focal point:", dbError);
          throw dbError;
        }
      } catch (error) {
        console.error("Error updating focal point:", error);
        return ctx.internalServerError(
          "An error occurred while updating the focal point"
        );
      }
    },

    // Add an endpoint to get detailed file information
    async getFileDetails(ctx) {
      try {
        const { id } = ctx.params;

        if (!id) {
          return ctx.badRequest("File ID is required");
        }

        // Query the file
        const fileModel = strapi.query("plugin::upload.file");
        const file = await fileModel.findOne({
          where: { id },
        });

        if (!file) {
          return ctx.notFound("File not found");
        }

        // Extract focal point from provider_metadata
        let focalPoint = null;
        if (file.provider_metadata && file.provider_metadata.focalPoint) {
          focalPoint = file.provider_metadata.focalPoint;
        }

        // Log important details for debugging
        console.log("File details:", {
          id: file.id,
          name: file.name,
          hasProviderMetadata: !!file.provider_metadata,
          focalPoint: focalPoint,
          updatedAt: file.updatedAt,
        });

        // Force include focal point in response if found
        const responseWithFocalPoint = {
          ...file,
          focalPoint,
        };

        return responseWithFocalPoint;
      } catch (error) {
        console.error("Error getting file details:", error);
        return ctx.internalServerError(
          "An error occurred while getting file details"
        );
      }
    },

    async batchUploadGallery(ctx) {
      console.log("Batch upload endpoint called - test route working!");
      console.log("Method:", ctx.request.method);
      console.log("URL:", ctx.request.url);
      console.log("Params:", ctx.params);
      
      return ctx.send({
        message: "Batch upload endpoint is working!",
        method: ctx.request.method,
        params: ctx.params
      });
    },
  };

  // Register a formatter to ensure the focal point is included in responses
  const formatFile = plugin.services.upload.formatFileInfo;
  plugin.services.upload.formatFileInfo = (file) => {
    const formattedFile = formatFile(file);

    // If we've attached a focalPoint directly, add it to the response
    if (file.focalPoint) {
      formattedFile.focalPoint = file.focalPoint;
      return formattedFile;
    }

    // Check provider_metadata for focal point
    if (file.provider_metadata && file.provider_metadata.focalPoint) {
      formattedFile.focalPoint = file.provider_metadata.focalPoint;
    }

    return formattedFile;
  };

  // Add the custom routes to admin API
  plugin.routes.admin.routes.push({
    method: "POST",
    path: "/updateFocalPoint/:id",
    handler: "upload.updateFocalPoint",
    config: {
      policies: [],
      auth: { scope: ["admin"] },
    },
  });

  plugin.routes.admin.routes.push({
    method: "GET",
    path: "/fileDetails/:id",
    handler: "upload.getFileDetails",
    config: {
      policies: [],
      auth: { scope: ["admin"] },
    },
  });

  plugin.routes.admin.routes.push({
    method: "POST",
    path: "/batch-upload-gallery/:id",
    handler: "upload.batchUploadGallery",
    config: {
      policies: [],
      auth: { scope: ["admin"] },
    },
  });

  return plugin;
};
