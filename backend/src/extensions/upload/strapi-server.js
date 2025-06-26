"use strict";

const fs = require("fs");
const { createReadStream } = require("fs");
const https = require("https");
const http = require("http");

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

    async reportPhoto(ctx) {
      try {
        const { id } = ctx.params;
        const { reason, isSubjectInImage, otherReason } = ctx.request.body;
        const clientIP = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || ctx.request.connection.remoteAddress;
        const userAgent = ctx.request.headers['user-agent'];

        // Input validation
        if (!id) {
          return ctx.badRequest("File ID is required");
        }

        if (!reason) {
          return ctx.badRequest("Report reason is required");
        }

        // Rate limiting check (simple in-memory implementation)
        const rateLimit = strapi.photoReportRateLimit || new Map();
        const rateLimitKey = clientIP;
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window

        if (!rateLimit.has(rateLimitKey)) {
          rateLimit.set(rateLimitKey, []);
        }

        const requests = rateLimit.get(rateLimitKey).filter(time => time > windowStart);
        if (requests.length >= 5) {
          return ctx.tooManyRequests("Too many reports. Please try again later.");
        }

        requests.push(now);
        rateLimit.set(rateLimitKey, requests);
        strapi.photoReportRateLimit = rateLimit;

        // Get the file
        const fileModel = strapi.query("plugin::upload.file");
        const file = await fileModel.findOne({
          where: { id },
        });

        if (!file) {
          return ctx.notFound("File not found");
        }

        // Prepare the new report data
        const newReport = {
          reason: reason,
          otherReason: reason === 'other' ? otherReason : null,
          isSubjectInImage: isSubjectInImage,
          reportedAt: new Date().toISOString(),
          ipAddress: clientIP,
          userAgent: userAgent,
          reportId: Date.now().toString() // Simple unique ID
        };

        // Get existing provider metadata
        const providerMetadata = file.provider_metadata || {};
        
        // Handle multiple reports
        if (providerMetadata.reportInfo) {
          // Check if this IP already reported this image (prevent duplicate reports from same IP)
          const existingReports = Array.isArray(providerMetadata.reportInfo.reports) 
            ? providerMetadata.reportInfo.reports 
            : [providerMetadata.reportInfo];
          
          const alreadyReportedByThisIP = existingReports.some(report => 
            report.ipAddress === clientIP
          );
          
          if (alreadyReportedByThisIP) {
            return ctx.badRequest("You have already reported this image");
          }
          
          // Add to existing reports
          if (!Array.isArray(providerMetadata.reportInfo.reports)) {
            // Convert old single report to array format
            providerMetadata.reportInfo = {
              reason: providerMetadata.reportInfo.reason,
              reportedAt: providerMetadata.reportInfo.reportedAt,
              reports: [providerMetadata.reportInfo, newReport]
            };
          } else {
            // Add to existing reports array
            providerMetadata.reportInfo.reports.push(newReport);
          }
        } else {
          // First report for this image
          providerMetadata.reportInfo = {
            reason: newReport.reason,
            reportedAt: newReport.reportedAt,
            reports: [newReport]
          };
        }

        // Update the file with the report info
        await fileModel.update({
          where: { id },
          data: {
            provider_metadata: providerMetadata,
          },
        });

        const reportCount = Array.isArray(providerMetadata.reportInfo.reports) 
          ? providerMetadata.reportInfo.reports.length 
          : 1;

        console.log("Photo report recorded:", { 
          fileId: id, 
          reason, 
          reportedAt: newReport.reportedAt,
          totalReports: reportCount 
        });

        return { 
          success: true, 
          message: "Report recorded successfully",
          reportCount: reportCount
        };
      } catch (error) {
        console.error("Error recording photo report:", error);
        return ctx.internalServerError("An error occurred while recording the report");
      }
    },

  };

  // Register a formatter to ensure the focal point and report info are included in responses
  const formatFile = plugin.services.upload.formatFileInfo;
  plugin.services.upload.formatFileInfo = (file) => {
    const formattedFile = formatFile(file);

    // If we've attached a focalPoint directly, add it to the response
    if (file.focalPoint) {
      formattedFile.focalPoint = file.focalPoint;
    }

    // Check provider_metadata for focal point and report info
    if (file.provider_metadata) {
      if (file.provider_metadata.focalPoint) {
        formattedFile.focalPoint = file.provider_metadata.focalPoint;
      }
      
      if (file.provider_metadata.reportInfo) {
        formattedFile.isReported = true;
        formattedFile.reportInfo = file.provider_metadata.reportInfo;
      } else {
        formattedFile.isReported = false;
      }
    } else {
      formattedFile.isReported = false;
    }

    return formattedFile;
  };
  
  // Override the getSignedUrl method to handle local proxy URLs
  const originalGetSignedUrl = plugin.services.upload.getSignedUrl;
  plugin.services.upload.getSignedUrl = (file) => {
    // If the URL is already a local proxy URL, return it as-is
    if (file.url && file.url.includes('/api/image-proxy/')) {
      return { url: file.url };
    }
    
    // Otherwise, use the original method
    return originalGetSignedUrl(file);
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

  // Add public route for photo reporting (no auth required)
  // Create content-api routes if they don't exist
  if (!plugin.routes["content-api"]) {
    plugin.routes["content-api"] = { routes: [] };
  }
  
  plugin.routes["content-api"].routes.push({
    method: "POST",
    path: "/report-photo/:id",
    handler: "upload.reportPhoto",
    config: {
      policies: [],
      auth: false,
    },
  });

  // Image proxy is now handled by separate API route

  return plugin;
};
