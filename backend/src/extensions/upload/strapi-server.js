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
      try {
        console.log("Admin batch upload endpoint called via upload extension");
        console.log("Request files:", ctx.request.files);
        console.log("Request body keys:", Object.keys(ctx.request.body || {}));

        const { id } = ctx.params; // Article ID

        // Validate if article exists (use entityService to bypass permissions)
        const article = await strapi.entityService.findOne("api::article.article", id, {
          populate: {
            gallery: {
              populate: {
                gallery_items: {
                  populate: {
                    image: true,
                  },
                },
              },
            },
          },
        });

        if (!article) {
          console.log(`Article not found for ID: ${id}`);
          return ctx.notFound("Article not found");
        }

        // Check if files are in request
        if (!ctx.request.files || Object.keys(ctx.request.files).length === 0) {
          console.log("No files found in request");
          console.log("Available request keys:", Object.keys(ctx.request));
          return ctx.badRequest("No files to upload");
        }

        // Get all the files from the request
        const filesToUpload = ctx.request.files.files;
        const fileCount = Array.isArray(filesToUpload) ? filesToUpload.length : 1;

        console.log(
          `Handling batch upload for article ${id} with ${fileCount} files`
        );

        // Upload all files
        const uploadedFiles = [];
        const uploadService = strapi.plugin("upload").service("upload");

        // Handle case where filesToUpload is an array (multiple files)
        if (Array.isArray(filesToUpload)) {
          // Upload multiple files at once
          const uploadResults = await uploadService.upload({
            files: filesToUpload,
            data: {
              fileInfo: filesToUpload.map((file) => ({
                name: file.name,
                caption: file.name,
                alternativeText: file.name,
              })),
            },
          });

          uploadedFiles.push(...uploadResults);
        }
        // Handle case where filesToUpload is a single file object
        else {
          const [result] = await uploadService.upload({
            files: filesToUpload,
            data: {
              fileInfo: {
                name: filesToUpload.name,
                caption: filesToUpload.name,
                alternativeText: filesToUpload.name,
              },
            },
          });

          uploadedFiles.push(result);
        }

        console.log(`Successfully uploaded ${uploadedFiles.length} files`);

        // Now create gallery items and update the article
        const galleryItems = [];

        // First, check if article has a gallery component
        let galleryData = article.gallery || null;

        // If no gallery exists, we'll need to update the article with a new gallery
        if (!galleryData) {
          // First update the article with an empty gallery
          galleryData = {
            caption: `Gallery for ${article.title || "Article"}`,
            gallery_items: [],
          };

          // Update the article with the empty gallery first
          await strapi.entityService.update("api::article.article", id, {
            data: {
              gallery: galleryData,
            },
          });

          // Reload the article to get the fresh data (use entityService to bypass permissions)
          const updatedArticle = await strapi.entityService.findOne("api::article.article", id, {
            populate: {
              gallery: {
                populate: {
                  gallery_items: {
                    populate: {
                      image: true,
                    },
                  },
                },
              },
            },
          });

          // Get the updated gallery data
          galleryData = updatedArticle.gallery;
        }

        // Get any existing gallery items and filter out null/invalid ones
        const existingItems = (galleryData?.gallery_items || []).filter(item => item && item.image);

        // Create new gallery items
        for (const file of uploadedFiles) {
          // Create new gallery item data
          const galleryItemData = {
            image: file.id,
            caption: file.caption || file.name,
            alt_text: file.alternativeText || file.name,
            display_size: "medium",
          };

          // Push to our array of new items
          galleryItems.push(galleryItemData);
        }

        // Combine existing and new gallery items, filtering out any null/undefined items
        const allItems = [...existingItems, ...galleryItems].filter(item => item && item.image);

        // Update the article with all gallery items
        const updatedArticle = await strapi.entityService.update(
          "api::article.article",
          id,
          {
            data: {
              gallery: {
                caption: galleryData.caption,
                gallery_items: allItems,
              },
            },
          }
        );

        return {
          message: `Successfully added ${uploadedFiles.length} images to the gallery`,
          uploadedFiles,
          article: {
            id: updatedArticle.id,
            title: updatedArticle.title,
          },
        };
      } catch (error) {
        console.error("Error in admin batch upload:", error);
        return ctx.internalServerError(
          `Failed to upload images: ${error.message}`
        );
      }
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
