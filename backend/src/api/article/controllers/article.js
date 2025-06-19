"use strict";

/**
 *  article controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const utils = require("@strapi/utils");
const { UnauthorizedError } = utils.errors;

module.exports = createCoreController("api::article.article", ({ strapi }) => ({
  // Override the default find method to filter out unlisted articles
  async find(ctx) {
    // Check if this is for static generation (bypass listed filter)
    const bypassListedFilter = ctx.query.bypassListedFilter === 'true';
    
    if (bypassListedFilter) {
      // Remove the bypass parameter and use default behavior
      delete ctx.query.bypassListedFilter;
      return await super.find(ctx);
    }
    
    // Add filter to only show listed articles in collections
    const modifiedParams = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        listed: true
      }
    };
    
    // Execute the query with the modified parameters
    const { results, pagination } = await strapi
      .service('api::article.article')
      .find(modifiedParams);

    // Sanitize and return the results
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // Keep findOne unchanged - allows direct access to any published article
  async findOne(ctx) {
    return await super.findOne(ctx);
  },


  async batchUploadGalleryImages(ctx) {
    try {
      console.log("Batch upload endpoint called");
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
      console.error("Error in batch upload:", error);
      return ctx.internalServerError(
        `Failed to upload images: ${error.message}`
      );
    }
  },
}));