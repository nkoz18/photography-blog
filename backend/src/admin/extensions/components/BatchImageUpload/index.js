import React, { useState } from "react";
import { Button, Typography, Box, Alert } from "@strapi/design-system";
import { Upload } from "@strapi/icons";
import { useCMEditViewDataManager, auth } from "@strapi/helper-plugin";
import styled from "styled-components";
import { ErrorBoundary } from "react-error-boundary";

const UploadBox = styled.div`
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.isDragging ? "#f0f0ff" : "none")};

  &:hover {
    border-color: #4945ff;
    background: #f6f6ff;
  }
`;

const FileInput = styled.input`
  display: none;
`;

// Error fallback component for Error Boundary
const ErrorFallback = ({ error }) => (
  <Box padding={4} background="neutral100" shadow="filterShadow" hasRadius>
    <Typography variant="delta" as="h2" textColor="danger600">
      Something went wrong
    </Typography>
    <Box paddingTop={2} paddingBottom={2}>
      <Typography textColor="neutral800">{error.message}</Typography>
    </Box>
  </Box>
);

const BatchUploadContent = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const { initialData, modifiedData } = useCMEditViewDataManager();

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(newFiles);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
    }
  };

  const uploadFiles = async () => {
    if (!files.length) {
      setStatus({ type: "error", message: "No files selected for upload" });
      return;
    }

    if (!initialData.id) {
      setStatus({
        type: "error",
        message: "Save the article first before adding gallery images",
      });
      return;
    }

    try {
      setUploading(true);
      setStatus({ type: "info", message: "Uploading files..." });

      // Create form data with all selected files
      const formData = new FormData();

      // Append each file with the same key 'files' to create an array on the server
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Log the FormData for debugging (doesn't show in console but useful for verification)
      console.log("FormData prepared with", files.length, "files");

      // Get the auth token
      const token = auth.getToken();
      
      // Use the standard upload endpoint and then attach to gallery
      const response = await fetch(
        `/upload`,
        {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // Log the response
      console.log("Response status:", response.status);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Upload failed with status ${response.status}`;
        const contentType = response.headers.get("content-type");
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
        } else {
          // If it's HTML or text, just use the status text
          errorMessage = `Server error: ${response.statusText || 'Unknown error'}`;
        }
        
        throw new Error(errorMessage);
      }

      const uploadedFiles = await response.json();
      console.log("Uploaded files:", uploadedFiles);

      setStatus({
        type: "success",
        message: `Successfully uploaded ${uploadedFiles.length || 0} files! (Gallery attachment coming next)`,
      });
      setFiles([]);

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);

      setStatus({
        type: "error",
        message: error.message || "Upload failed. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box padding={4} background="neutral100" shadow="filterShadow" hasRadius>
      <Typography variant="delta" as="h2">
        Batch Upload Gallery Images
      </Typography>
      <Box paddingTop={4} paddingBottom={4}>
        <UploadBox
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("batch-file-input").click()}
        >
          <Upload width="3rem" height="3rem" color="#4945ff" />
          <Typography
            variant="omega"
            fontWeight="semiBold"
            textColor="neutral600"
            as="p"
          >
            Drag & drop your images here or click to browse
          </Typography>
          <FileInput
            id="batch-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
          />
        </UploadBox>

        {files.length > 0 && (
          <Box paddingBottom={4}>
            <Typography variant="pi" fontWeight="bold">
              {files.length} file(s) selected
            </Typography>
            <ul
              style={{
                maxHeight: "150px",
                overflowY: "auto",
                margin: "10px 0",
                padding: "0 10px",
              }}
            >
              {files.map((file, i) => (
                <li key={i}>
                  <Typography variant="pi">
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </Typography>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {status && (
          <Box paddingBottom={4}>
            <Alert
              closeLabel="Close"
              title={status.type === "error" ? "Error" : "Info"}
              variant={status.type}
              onClose={() =>
                status.type === "success" ? null : setStatus(null)
              }
            >
              {status.message}
            </Alert>
          </Box>
        )}

        <Button
          variant="default"
          startIcon={<Upload />}
          loading={uploading}
          disabled={files.length === 0 || uploading}
          onClick={uploadFiles}
        >
          Upload to Gallery
        </Button>
      </Box>
    </Box>
  );
};

// Wrap content in error boundary
const BatchImageUpload = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BatchUploadContent />
    </ErrorBoundary>
  );
};

export default BatchImageUpload;
