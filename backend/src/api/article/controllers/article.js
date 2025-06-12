"use strict";

/**
 *  article controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const utils = require("@strapi/utils");
const { UnauthorizedError } = utils.errors;

module.exports = createCoreController("api::article.article", ({ strapi }) => ({
  // Keep the default CRUD operations
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

  async findByToken(ctx) {
    try {
      const { slug, token } = ctx.params;

      // Input validation
      if (!slug || !token) {
        return ctx.badRequest("Both slug and token are required");
      }

      // Find article by slug and token
      const articles = await strapi.entityService.findMany("api::article.article", {
        filters: {
          slug: { $eq: slug },
          obscurityToken: { $eq: token },
        },
        populate: {
          categories: {
            populate: ["image"],
          },
          image: true,
          author: {
            populate: ["picture"],
          },
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

      if (!articles || articles.length === 0) {
        return ctx.notFound("Article not found or invalid token");
      }

      const article = articles[0];

      // Transform populated relations to match REST API format
      const transformedArticle = { ...article };
      
      // Transform image field if it exists
      if (transformedArticle.image) {
        transformedArticle.image = {
          data: {
            id: transformedArticle.image.id,
            attributes: transformedArticle.image
          }
        };
      }
      
      // Transform author field if it exists
      if (transformedArticle.author) {
        transformedArticle.author = {
          data: {
            id: transformedArticle.author.id,
            attributes: transformedArticle.author
          }
        };
      }
      
      // Transform categories field if it exists
      if (transformedArticle.categories) {
        transformedArticle.categories = {
          data: transformedArticle.categories.map(cat => ({
            id: cat.id,
            attributes: cat
          }))
        };
      }
      
      // Transform gallery field if it exists
      if (transformedArticle.gallery) {
        const gallery = { ...transformedArticle.gallery };
        
        if (gallery.gallery_items) {
          // Transform gallery_items to match expected structure
          gallery.gallery_items = gallery.gallery_items.map(item => ({
            id: item.id,
            attributes: {
              ...item,
              image: item.image ? {
                data: {
                  id: item.image.id,
                  attributes: item.image
                }
              } : null
            }
          }));
        }
        
        transformedArticle.gallery = {
          data: {
            id: gallery.id,
            attributes: gallery
          }
        };
      }

      // Convert to standard Strapi API format to maintain compatibility with frontend
      return {
        data: {
          id: transformedArticle.id,
          attributes: transformedArticle
        }
      };
    } catch (error) {
      console.error("Error finding article by token:", error);
      return ctx.internalServerError("An error occurred while finding the article");
    }
  },

  // Override the default create/update to auto-generate tokens
  async create(ctx) {
    // Generate obscurity token if not provided
    if (!ctx.request.body.data.obscurityToken) {
      const token = generateObscurityToken();
      ctx.request.body.data.obscurityToken = token;
      console.log("Generated new obscurity token for article:", token);
    }
    
    // Call the default create method
    const result = await super.create(ctx);
    console.log("Created article with token:", result.data.attributes.obscurityToken);
    return result;
  },

  async update(ctx) {
    const { id } = ctx.params;
    
    // Check if article exists and doesn't have a token
    const existingArticle = await strapi.entityService.findOne("api::article.article", id);
    
    if (existingArticle && !existingArticle.obscurityToken) {
      // Generate token if it doesn't exist
      const token = generateObscurityToken();
      ctx.request.body.data.obscurityToken = token;
      console.log("Generated obscurity token for existing article", id, ":", token);
    }
    
    // Call the default update method
    const result = await super.update(ctx);
    console.log("Updated article", id, "with token:", result.data.attributes.obscurityToken);
    return result;
  },

  async generateToken(ctx) {
    try {
      const { id } = ctx.params;
      
      // Check if article exists
      const existingArticle = await strapi.entityService.findOne("api::article.article", id);
      
      if (!existingArticle) {
        return ctx.notFound("Article not found");
      }
      
      // Generate new token or use existing
      let token = existingArticle.obscurityToken;
      if (!token) {
        token = generateObscurityToken();
        
        // Update the article with the new token using entityService to bypass permissions
        await strapi.entityService.update("api::article.article", id, {
          data: {
            obscurityToken: token
          }
        });
        
        console.log("Generated new obscurity token for article", id, ":", token);
      } else {
        console.log("Article", id, "already has token:", token);
      }
      
      return {
        success: true,
        token: token,
        message: "Token generated successfully"
      };
    } catch (error) {
      console.error("Error generating token:", error);
      return ctx.internalServerError("Failed to generate token");
    }
  },
}));

// Helper function to generate 12-character obscurity token
function generateObscurityToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
