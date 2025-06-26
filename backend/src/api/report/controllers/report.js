'use strict';

/**
 * Report controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::report.report', ({ strapi }) => ({
  /**
   * Create a new image report (public endpoint)
   */
  async create(ctx) {
    try {
      const { reportedImageId, reason, otherReason, isSubjectInImage } = ctx.request.body;
      
      // Get client information
      const clientIP = ctx.request.ip || 
                      ctx.request.headers['x-forwarded-for'] || 
                      ctx.request.connection.remoteAddress;
      const userAgent = ctx.request.headers['user-agent'];
      
      // Parse browser info
      const browserInfo = this.parseBrowserInfo(userAgent);

      // Input validation
      if (!reportedImageId) {
        return ctx.badRequest('Reported image ID is required');
      }

      if (!reason) {
        return ctx.badRequest('Report reason is required');
      }

      if (!isSubjectInImage) {
        return ctx.badRequest('Please specify if you are in the image');
      }

      // Rate limiting check
      const isRateLimited = await this.checkRateLimit(clientIP);
      if (isRateLimited) {
        return ctx.tooManyRequests('Too many reports. Please try again later.');
      }

      // Check if this IP already reported this image
      const existingReport = await strapi.documents('api::report.report').findMany({
        filters: {
          reportedImage: reportedImageId,
          ipAddress: clientIP
        }
      });

      if (existingReport.length > 0) {
        return ctx.badRequest('You have already reported this image');
      }

      // Verify the image exists
      const image = await strapi.documents('plugin::upload.file').findOne({
        documentId: "__TODO__"
      });
      if (!image) {
        return ctx.notFound('Image not found');
      }

      // Create the report
      const reportData = {
        reportedImage: reportedImageId,
        reason,
        otherReason: reason === 'other' ? otherReason : null,
        isSubjectInImage,
        ipAddress: clientIP,
        userAgent,
        browserInfo,
        reportedAt: new Date(),
        status: 'pending'
      };

      const report = await strapi.documents('api::report.report').create({
        data: reportData,
        populate: ['reportedImage']
      });

      console.log('New image report created:', {
        id: report.id,
        imageId: reportedImageId,
        reason,
        ipAddress: clientIP
      });

      return {
        success: true,
        message: 'Report submitted successfully',
        reportId: report.id
      };

    } catch (error) {
      console.error('Error creating image report:', error);
      return ctx.internalServerError('Failed to submit report');
    }
  },

  /**
   * Update report status (admin only)
   */
  async updateStatus(ctx) {
    try {
      const { id } = ctx.params;
      const { status, adminNotes } = ctx.request.body;
      const adminUser = ctx.state.user;

      if (!['pending', 'reviewed', 'approved', 'rejected'].includes(status)) {
        return ctx.badRequest('Invalid status');
      }

      const updateData = {
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: adminUser.id
      };

      const updatedReport = await strapi.documents('api::report.report').update({
        documentId: "__TODO__",
        data: updateData,
        populate: ['reportedImage', 'reviewedBy']
      });

      console.log('Report status updated:', {
        reportId: id,
        newStatus: status,
        reviewedBy: adminUser.email
      });

      return updatedReport;

    } catch (error) {
      console.error('Error updating report status:', error);
      return ctx.internalServerError('Failed to update report status');
    }
  },

  /**
   * Get reports with filtering and pagination (admin only)
   */
  async find(ctx) {
    try {
      const { query } = ctx;
      
      const reports = await strapi.documents('api::report.report').findMany({
        ...query,
        populate: {
          reportedImage: true,
          reviewedBy: {
            fields: ['firstname', 'lastname', 'email']
          }
        },
        sort: { reportedAt: 'desc' }
      });

      return reports;

    } catch (error) {
      console.error('Error fetching reports:', error);
      return ctx.internalServerError('Failed to fetch reports');
    }
  },

  /**
   * Get single report (admin only)
   */
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      const report = await strapi.documents('api::report.report').findOne({
        documentId: "__TODO__",

        populate: {
          reportedImage: true,
          reviewedBy: {
            fields: ['firstname', 'lastname', 'email']
          }
        }
      });

      if (!report) {
        return ctx.notFound('Report not found');
      }

      return report;

    } catch (error) {
      console.error('Error fetching report:', error);
      return ctx.internalServerError('Failed to fetch report');
    }
  },

  /**
   * Parse browser info from user agent
   */
  parseBrowserInfo(userAgent) {
    if (!userAgent) return null;

    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/?([\d.]+)/i);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)/i);
    const mobileMatch = userAgent.match(/(Mobile|Android|iPhone|iPad)/i);

    return {
      browser: browserMatch ? `${browserMatch[1]} ${browserMatch[2] || ''}`.trim() : 'Unknown',
      os: osMatch ? osMatch[1] : 'Unknown',
      isMobile: !!mobileMatch,
      raw: userAgent
    };
  },

  /**
   * Simple rate limiting implementation
   */
  async checkRateLimit(ipAddress) {
    const rateLimit = strapi.reportRateLimit || new Map();
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const maxRequests = 5;

    if (!rateLimit.has(ipAddress)) {
      rateLimit.set(ipAddress, []);
    }

    const requests = rateLimit.get(ipAddress).filter(time => time > windowStart);
    
    if (requests.length >= maxRequests) {
      return true; // Rate limited
    }

    requests.push(now);
    rateLimit.set(ipAddress, requests);
    strapi.reportRateLimit = rateLimit;

    return false; // Not rate limited
  }
}));