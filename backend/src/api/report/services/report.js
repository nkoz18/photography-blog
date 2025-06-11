'use strict';

/**
 * Report service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::report.report', ({ strapi }) => ({
  /**
   * Get reports for a specific image
   */
  async getReportsForImage(imageId) {
    return await strapi.entityService.findMany('api::report.report', {
      filters: {
        reportedImage: imageId
      },
      populate: ['reportedImage'],
      sort: { reportedAt: 'desc' }
    });
  },

  /**
   * Get pending reports
   */
  async getPendingReports() {
    return await strapi.entityService.findMany('api::report.report', {
      filters: {
        status: 'pending'
      },
      populate: {
        reportedImage: true,
        reviewedBy: {
          fields: ['firstname', 'lastname', 'email']
        }
      },
      sort: { reportedAt: 'desc' }
    });
  },

  /**
   * Get report statistics
   */
  async getReportStats() {
    const totalReports = await strapi.entityService.count('api::report.report');
    const pendingReports = await strapi.entityService.count('api::report.report', {
      filters: { status: 'pending' }
    });
    const approvedReports = await strapi.entityService.count('api::report.report', {
      filters: { status: 'approved' }
    });
    const rejectedReports = await strapi.entityService.count('api::report.report', {
      filters: { status: 'rejected' }
    });

    return {
      total: totalReports,
      pending: pendingReports,
      approved: approvedReports,
      rejected: rejectedReports
    };
  },

  /**
   * Check if image has been reported
   */
  async isImageReported(imageId) {
    const reports = await strapi.entityService.findMany('api::report.report', {
      filters: {
        reportedImage: imageId
      }
    });

    return reports.length > 0;
  }
}));