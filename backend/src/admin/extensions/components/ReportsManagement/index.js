/**
 * Reports Management Component
 * 
 * Displays a list of reported images with their report details
 */

import React, { useState, useEffect } from 'react';
import { Typography, Table, Thead, Tr, Th, Tbody, Td, Button, Dialog, DialogBody, DialogFooter } from '@strapi/design-system';
import { axiosInstance } from '../../utils/axiosInstance';

const ReportsManagement = () => {
  const [reportedImages, setReportedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    fetchReportedImages();
  }, []);

  const fetchReportedImages = async () => {
    try {
      setLoading(true);
      
      // Fetch all files from media library
      const response = await axiosInstance.get('/upload/files');
      
      // Filter files that have reportInfo in provider_metadata
      const reported = response.data.filter(file => 
        file.provider_metadata && 
        file.provider_metadata.reportInfo
      );
      
      setReportedImages(reported);
    } catch (error) {
      console.error('Error fetching reported images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (file) => {
    setSelectedReport(file);
    setShowDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatUserAgent = (userAgent) => {
    if (!userAgent) return 'Unknown';
    
    // Extract browser and OS info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i);
    
    const browser = browserMatch ? browserMatch[0] : 'Unknown Browser';
    const os = osMatch ? osMatch[1] : 'Unknown OS';
    
    return `${browser} on ${os}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Typography variant="alpha">Loading reported images...</Typography>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Typography variant="alpha" style={{ marginBottom: '24px' }}>
        Reported Images ({reportedImages.length})
      </Typography>
      
      {reportedImages.length === 0 ? (
        <Typography>No images have been reported.</Typography>
      ) : (
        <Table colCount={6} rowCount={reportedImages.length + 1}>
          <Thead>
            <Tr>
              <Th>
                <Typography variant="sigma">Image</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Name</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Reason</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Reported</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Reports</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Actions</Typography>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {reportedImages.map((file) => {
              const reportInfo = file.provider_metadata.reportInfo;
              const reportCount = Array.isArray(reportInfo.reports) ? reportInfo.reports.length : 1;
              
              return (
                <Tr key={file.id}>
                  <Td>
                    <img
                      src={file.url}
                      alt={file.name}
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  </Td>
                  <Td>
                    <Typography variant="omega">{file.name}</Typography>
                  </Td>
                  <Td>
                    <Typography variant="omega">{reportInfo.reason}</Typography>
                  </Td>
                  <Td>
                    <Typography variant="omega">
                      {formatDate(reportInfo.reportedAt)}
                    </Typography>
                  </Td>
                  <Td>
                    <Typography variant="omega">{reportCount}</Typography>
                  </Td>
                  <Td>
                    <Button
                      size="S"
                      variant="secondary"
                      onClick={() => handleViewReport(file)}
                    >
                      View Details
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      {/* Report Details Dialog */}
      <Dialog onClose={() => setShowDialog(false)} title="Report Details" isOpen={showDialog}>
        <DialogBody>
          {selectedReport && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <img
                  src={selectedReport.url}
                  alt={selectedReport.name}
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    marginBottom: '16px'
                  }}
                />
              </div>
              
              <Typography variant="beta" style={{ marginBottom: '12px' }}>
                {selectedReport.name}
              </Typography>
              
              {Array.isArray(selectedReport.provider_metadata.reportInfo.reports) ? (
                selectedReport.provider_metadata.reportInfo.reports.map((report, index) => (
                  <div key={index} style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '4px', 
                    padding: '16px', 
                    marginBottom: '12px' 
                  }}>
                    <Typography variant="delta" style={{ marginBottom: '8px' }}>
                      Report #{index + 1}
                    </Typography>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Reason:</strong> {report.reason}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong>User in photo:</strong> {report.isSubjectInImage}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Reported at:</strong> {formatDate(report.reportedAt)}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong>IP Address:</strong> {report.ipAddress || 'Unknown'}
                    </div>
                    
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Browser:</strong> {formatUserAgent(report.userAgent)}
                    </div>
                    
                    {report.otherReason && (
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Additional details:</strong> {report.otherReason}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px', 
                  padding: '16px' 
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Reason:</strong> {selectedReport.provider_metadata.reportInfo.reason}
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong>User in photo:</strong> {selectedReport.provider_metadata.reportInfo.isSubjectInImage}
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Reported at:</strong> {formatDate(selectedReport.provider_metadata.reportInfo.reportedAt)}
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong>IP Address:</strong> {selectedReport.provider_metadata.reportInfo.ipAddress || 'Unknown'}
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Browser:</strong> {formatUserAgent(selectedReport.provider_metadata.reportInfo.userAgent)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>
        <DialogFooter
          startAction={
            <Button onClick={() => setShowDialog(false)} variant="tertiary">
              Close
            </Button>
          }
        />
      </Dialog>
    </div>
  );
};

export default ReportsManagement;