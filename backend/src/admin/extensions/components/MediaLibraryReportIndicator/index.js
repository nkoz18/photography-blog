/**
 * Media Library Report Indicator Component
 * 
 * This component adds visual indicators for reported images in the Strapi Media Library.
 * It checks for reportInfo in the provider_metadata and displays warning badges.
 */

import React from 'react';

const MediaLibraryReportIndicator = ({ file }) => {
  // Check if the file has been reported
  const isReported = file?.provider_metadata?.reportInfo;
  
  if (!isReported) {
    return null;
  }

  const reportInfo = file.provider_metadata.reportInfo;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '4px',
        right: '4px',
        backgroundColor: '#ff4757',
        color: 'white',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 10,
        cursor: 'help'
      }}
      title={`Reported: ${reportInfo.reason} on ${new Date(reportInfo.reportedAt).toLocaleDateString()}`}
    >
      ⚠️
    </div>
  );
};

export default MediaLibraryReportIndicator;