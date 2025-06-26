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
    return await strapi.documents('api::report.report').findMany({
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
    return await strapi.documents('api::report.report').findMany({
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
    const totalReports = await strapi.documents('api::report.report').count();
    const pendingReports = await strapi.documents('api::report.report').count({
      filters: { status: 'pending' }
    });
    const approvedReports = await strapi.documents('api::report.report').count({
      filters: { status: 'approved' }
    });
    const rejectedReports = await strapi.documents('api::report.report').count({
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
    const reports = await strapi.documents('api::report.report').findMany({
      filters: {
        reportedImage: imageId
      }
    });

    return reports.length > 0;
  }
}));