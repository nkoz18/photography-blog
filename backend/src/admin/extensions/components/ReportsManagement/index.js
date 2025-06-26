/**
 * Reports Management Component
 * 
 * Displays a list of reported images using the new Report collection type
 */

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Table, 
  Thead, 
  Tr, 
  Th, 
  Tbody, 
  Td, 
  Button, 
  Dialog, 
  DialogBody, 
  DialogFooter,
  Badge,
  Flex,
  Box,
  Grid,
  GridItem,
  Select,
  Option,
  Textarea,
  Field,
  FieldLabel,
  Loader
} from '@strapi/design-system';
import { axiosInstance } from '../../utils/axiosInstance';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      let queryParams = 'populate[reportedImage]=*&populate[reviewedBy]=*&sort=reportedAt:desc';
      
      if (statusFilter !== 'all') {
        queryParams += `&filters[status][$eq]=${statusFilter}`;
      }
      
      const response = await axiosInstance.get(`/api/reports?${queryParams}`);
      
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setNewStatus(report.attributes.status);
    setAdminNotes(report.attributes.adminNotes || '');
    setShowDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport || !newStatus) return;

    try {
      setUpdating(true);
      
      await axiosInstance.post(`/api/reports/${selectedReport.id}/update-status`, {
        status: newStatus,
        adminNotes: adminNotes
      });

      // Refresh the reports list
      await fetchReports();
      setShowDialog(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'secondary';
      case 'approved': return 'danger';
      case 'rejected': return 'success';
      default: return 'neutral';
    }
  };

  const formatBrowserInfo = (browserInfo) => {
    if (!browserInfo) return 'Unknown';
    if (typeof browserInfo === 'string') return browserInfo;
    return `${browserInfo.browser} on ${browserInfo.os}${browserInfo.isMobile ? ' (Mobile)' : ''}`;
  };

  if (loading) {
    return (
      <Box padding={6}>
        <Flex direction="column" alignItems="center" gap={4}>
          <Loader />
          <Typography variant="omega">Loading reports...</Typography>
        </Flex>
      </Box>
    );
  }

  return (
    <Box padding={6}>
      <Flex direction="column" gap={4}>
        <Flex justifyContent="space-between" alignItems="center">
          <Typography variant="alpha">
            Image Reports ({reports.length})
          </Typography>
          
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter by status"
          >
            <Option value="all">All Reports</Option>
            <Option value="pending">Pending</Option>
            <Option value="reviewed">Reviewed</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>
        </Flex>
        
        {reports.length === 0 ? (
          <Typography>No reports found for the selected filter.</Typography>
        ) : (
          <Table colCount={7} rowCount={reports.length + 1}>
            <Thead>
              <Tr>
                <Th><Typography variant="sigma">Image</Typography></Th>
                <Th><Typography variant="sigma">Reason</Typography></Th>
                <Th><Typography variant="sigma">User in Photo</Typography></Th>
                <Th><Typography variant="sigma">Status</Typography></Th>
                <Th><Typography variant="sigma">Reported</Typography></Th>
                <Th><Typography variant="sigma">IP Address</Typography></Th>
                <Th><Typography variant="sigma">Actions</Typography></Th>
              </Tr>
            </Thead>
            <Tbody>
              {reports.map((report) => {
                const { attributes } = report;
                const image = attributes.reportedImage?.data?.attributes;
                
                return (
                  <Tr key={report.id}>
                    <Td>
                      {image ? (
                        <img
                          src={image.url}
                          alt={image.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      ) : (
                        <Typography variant="omega" textColor="neutral500">
                          No image
                        </Typography>
                      )}
                    </Td>
                    <Td>
                      <Typography variant="omega">{attributes.reason}</Typography>
                    </Td>
                    <Td>
                      <Typography variant="omega">{attributes.isSubjectInImage}</Typography>
                    </Td>
                    <Td>
                      <Badge variant={getStatusColor(attributes.status)}>
                        {attributes.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Typography variant="omega">
                        {formatDate(attributes.reportedAt)}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography variant="omega" fontFamily="monospace">
                        {attributes.ipAddress || 'Unknown'}
                      </Typography>
                    </Td>
                    <Td>
                      <Button
                        size="S"
                        variant="secondary"
                        onClick={() => handleViewReport(report)}
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
      </Flex>

      {/* Report Details Dialog */}
      <Dialog 
        onClose={() => setShowDialog(false)} 
        title="Report Details" 
        isOpen={showDialog}
        style={{ width: '600px' }}
      >
        <DialogBody>
          {selectedReport && (
            <Flex direction="column" gap={4}>
              {/* Image Preview */}
              {selectedReport.attributes.reportedImage?.data && (
                <Box>
                  <img
                    src={selectedReport.attributes.reportedImage.data.attributes.url}
                    alt={selectedReport.attributes.reportedImage.data.attributes.name}
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginBottom: '16px'
                    }}
                  />
                  <Typography variant="beta">
                    {selectedReport.attributes.reportedImage.data.attributes.name}
                  </Typography>
                </Box>
              )}
              
              {/* Report Details Grid */}
              <Grid gap={4}>
                <GridItem col={6}>
                  <Field>
                    <FieldLabel>Reason</FieldLabel>
                    <Typography>{selectedReport.attributes.reason}</Typography>
                  </Field>
                </GridItem>
                
                <GridItem col={6}>
                  <Field>
                    <FieldLabel>User in Photo</FieldLabel>
                    <Typography>{selectedReport.attributes.isSubjectInImage}</Typography>
                  </Field>
                </GridItem>
                
                {selectedReport.attributes.otherReason && (
                  <GridItem col={12}>
                    <Field>
                      <FieldLabel>Additional Details</FieldLabel>
                      <Typography>{selectedReport.attributes.otherReason}</Typography>
                    </Field>
                  </GridItem>
                )}
                
                <GridItem col={6}>
                  <Field>
                    <FieldLabel>Reported At</FieldLabel>
                    <Typography>{formatDate(selectedReport.attributes.reportedAt)}</Typography>
                  </Field>
                </GridItem>
                
                <GridItem col={6}>
                  <Field>
                    <FieldLabel>IP Address</FieldLabel>
                    <Typography fontFamily="monospace">
                      {selectedReport.attributes.ipAddress || 'Unknown'}
                    </Typography>
                  </Field>
                </GridItem>
                
                <GridItem col={12}>
                  <Field>
                    <FieldLabel>Browser Info</FieldLabel>
                    <Typography>
                      {formatBrowserInfo(selectedReport.attributes.browserInfo)}
                    </Typography>
                  </Field>
                </GridItem>
                
                {selectedReport.attributes.reviewedBy?.data && (
                  <>
                    <GridItem col={6}>
                      <Field>
                        <FieldLabel>Reviewed By</FieldLabel>
                        <Typography>
                          {selectedReport.attributes.reviewedBy.data.attributes.firstname} {selectedReport.attributes.reviewedBy.data.attributes.lastname}
                        </Typography>
                      </Field>
                    </GridItem>
                    
                    <GridItem col={6}>
                      <Field>
                        <FieldLabel>Reviewed At</FieldLabel>
                        <Typography>
                          {formatDate(selectedReport.attributes.reviewedAt)}
                        </Typography>
                      </Field>
                    </GridItem>
                  </>
                )}
              </Grid>
              
              {/* Status Update Section */}
              <Box 
                padding={4} 
                background="neutral100" 
                borderRadius="4px"
              >
                <Typography variant="delta" marginBottom={3}>
                  Update Report Status
                </Typography>
                
                <Grid gap={4}>
                  <GridItem col={6}>
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select value={newStatus} onChange={setNewStatus}>
                        <Option value="pending">Pending</Option>
                        <Option value="reviewed">Reviewed</Option>
                        <Option value="approved">Approved (Remove Image)</Option>
                        <Option value="rejected">Rejected (Keep Image)</Option>
                      </Select>
                    </Field>
                  </GridItem>
                  
                  <GridItem col={12}>
                    <Field>
                      <FieldLabel>Admin Notes</FieldLabel>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about your decision..."
                        rows={3}
                      />
                    </Field>
                  </GridItem>
                </Grid>
              </Box>
            </Flex>
          )}
        </DialogBody>
        
        <DialogFooter
          startAction={
            <Button onClick={() => setShowDialog(false)} variant="tertiary">
              Close
            </Button>
          }
          endAction={
            <Button 
              onClick={handleUpdateStatus} 
              loading={updating}
              disabled={updating || !newStatus}
            >
              Update Status
            </Button>
          }
        />
      </Dialog>
    </Box>
  );
};

export default ReportsManagement;