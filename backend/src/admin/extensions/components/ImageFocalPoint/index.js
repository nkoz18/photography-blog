import React, { useState, useEffect, useRef } from "react";
import { useCMEditViewDataManager } from "@strapi/helper-plugin";
import styled from "styled-components";
import { Box } from "@strapi/design-system/Box";
import { Typography } from "@strapi/design-system/Typography";
import {
  Accordion,
  AccordionToggle,
  AccordionContent,
} from "@strapi/design-system/Accordion";
import { Button } from "@strapi/design-system/Button";
import { Stack } from "@strapi/design-system/Stack";
import { request } from "@strapi/helper-plugin";
import { useNotification } from "@strapi/helper-plugin";

const ImageContainer = styled.div`
  position: relative;
  width: 400px;
  margin-top: 16px;
  margin-bottom: 16px;
  cursor: crosshair;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const FocalPoint = styled.div`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const ButtonWrapper = styled.div`
  margin-top: 16px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
`;

// Add padding to the accordion content
const StyledAccordionContent = styled(AccordionContent)`
  padding: 10px !important;
`;

const ImageFocalPoint = () => {
  const { modifiedData, layout, onChange } = useCMEditViewDataManager();
  const toggleNotification = useNotification();
  const [hasFeaturedImage, setHasFeaturedImage] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageId, setImageId] = useState(null);
  const [focalPoint, setFocalPoint] = useState({ x: 50, y: 50 }); // Default center
  const [expanded, setExpanded] = useState(true);
  const imageRef = useRef(null);

  // Function to extract focal point from image data
  const extractFocalPoint = (image) => {
    if (!image) return { x: 50, y: 50 };

    // Check for direct focalPoint property
    if (image.focalPoint) {
      console.log("Found direct focalPoint property:", image.focalPoint);
      return {
        x: parseFloat(image.focalPoint.x),
        y: parseFloat(image.focalPoint.y),
      };
    }

    // Check provider_metadata
    if (image.provider_metadata && image.provider_metadata.focalPoint) {
      console.log(
        "Found focalPoint in provider_metadata:",
        image.provider_metadata.focalPoint
      );
      return {
        x: parseFloat(image.provider_metadata.focalPoint.x),
        y: parseFloat(image.provider_metadata.focalPoint.y),
      };
    }

    // Check in attributes
    if (image.attributes) {
      // Check direct focalPoint in attributes
      if (image.attributes.focalPoint) {
        console.log(
          "Found focalPoint in attributes:",
          image.attributes.focalPoint
        );
        return {
          x: parseFloat(image.attributes.focalPoint.x),
          y: parseFloat(image.attributes.focalPoint.y),
        };
      }

      // Check provider_metadata in attributes
      if (
        image.attributes.provider_metadata &&
        image.attributes.provider_metadata.focalPoint
      ) {
        console.log(
          "Found focalPoint in attributes.provider_metadata:",
          image.attributes.provider_metadata.focalPoint
        );
        return {
          x: parseFloat(image.attributes.provider_metadata.focalPoint.x),
          y: parseFloat(image.attributes.provider_metadata.focalPoint.y),
        };
      }
    }

    console.log("No focal point found, using default");
    return { x: 50, y: 50 };
  };

  // Fetch and process image data when the component mounts or modifiedData changes
  useEffect(() => {
    console.log("ImageFocalPoint - modifiedData:", modifiedData);

    try {
      let image = null;
      let imgUrl = "";
      let imgId = null;

      // Check for different image structures
      if (modifiedData && modifiedData.image) {
        // Handle both direct objects and relational data
        if (modifiedData.image.url) {
          // Direct URL
          image = modifiedData.image;
          imgUrl = image.url;
          imgId = image.id;
        } else if (modifiedData.image.data) {
          // Relational data structure
          if (modifiedData.image.data.attributes) {
            image = modifiedData.image.data;
            imgUrl = image.attributes.url;
            imgId = image.id;
          } else if (modifiedData.image.data.url) {
            image = modifiedData.image.data;
            imgUrl = image.url;
            imgId = image.id;
          }
        }

        console.log("Found image:", image);

        if (imgUrl) {
          // Make sure URL is absolute
          if (imgUrl.startsWith("/")) {
            imgUrl = `${window.location.origin}${imgUrl}`;
          }

          setImageData(image);
          setImageUrl(imgUrl);
          setImageId(imgId);
          setHasFeaturedImage(true);

          // Once we have image ID, fetch detailed file info
          if (imgId) {
            fetchImageDetails(imgId);
          } else {
            // Extract focal point from basic image data
            const foundFocalPoint = extractFocalPoint(image);
            setFocalPoint(foundFocalPoint);
          }
        } else {
          console.log("No valid image URL found");
          setHasFeaturedImage(false);
        }
      } else {
        console.log("No image data found");
        setHasFeaturedImage(false);
      }
    } catch (err) {
      console.error("Error processing image data:", err);
      setHasFeaturedImage(false);
    }
  }, [modifiedData]);

  // Fetch detailed image information including focal point
  const fetchImageDetails = async (id) => {
    if (!id) return;

    try {
      // Use our endpoint to get detailed file information
      const response = await request(`/upload/fileDetails/${id}`, {
        method: "GET",
      });

      console.log("Fetched image details:", response);

      if (response) {
        // Extract and update focal point if found
        const detailedFocalPoint = extractFocalPoint(response);
        console.log(
          "Setting focal point from fetched details:",
          detailedFocalPoint
        );
        setFocalPoint(detailedFocalPoint);
      }
    } catch (error) {
      console.error("Error fetching image details:", error);

      // Fall back to extracting focal point from basic image data
      if (imageData) {
        const basicFocalPoint = extractFocalPoint(imageData);
        setFocalPoint(basicFocalPoint);
      }
    }
  };

  const handleImageClick = (e) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Round to 2 decimal places for cleaner display
    const newFocalPoint = {
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    };

    console.log("Setting new focal point from click:", newFocalPoint);
    setFocalPoint(newFocalPoint);
  };

  const handleSaveFocalPoint = async () => {
    if (!imageId) {
      console.error("No image ID available");
      toggleNotification({
        type: "warning",
        message: "Cannot save focal point: No image ID available",
      });
      return;
    }

    try {
      console.log(`Saving focal point for image ID ${imageId}:`, focalPoint);

      // Use the admin API endpoint
      const response = await request(`/upload/updateFocalPoint/${imageId}`, {
        method: "POST",
        body: {
          focalPoint,
        },
      });

      console.log("Update response:", response);

      // Show success message using the notification hook
      toggleNotification({
        type: "success",
        message: "Focal point saved successfully",
      });

      // Wait a moment, then fetch the latest image details to verify saving
      setTimeout(() => fetchImageDetails(imageId), 500);
    } catch (error) {
      console.error("Error saving focal point:", error);
      toggleNotification({
        type: "warning",
        message: `Error saving focal point: ${
          error.message || "Unknown error"
        }`,
      });
    }
  };

  if (!hasFeaturedImage) {
    return null;
  }

  return (
    <Box padding={4} background="neutral0" shadow="tableShadow" marginTop={6}>
      <Accordion
        expanded={expanded}
        onToggle={() => setExpanded((prevState) => !prevState)}
        id="focal-point-accordion"
      >
        <AccordionToggle
          title="Featured Image Focal Point"
          description="Set the focal point for cropping"
        />
        <StyledAccordionContent>
          <Typography variant="omega">
            Click on the image to set the focal point that should remain visible
            when cropped:
          </Typography>

          <ImageContainer onClick={handleImageClick} ref={imageRef}>
            <img src={imageUrl} alt="Featured" />
            <FocalPoint
              style={{
                left: `${focalPoint.x}%`,
                top: `${focalPoint.y}%`,
              }}
            />
          </ImageContainer>

          <ButtonWrapper>
            <Button onClick={handleSaveFocalPoint}>Save Focal Point</Button>
          </ButtonWrapper>
        </StyledAccordionContent>
      </Accordion>
    </Box>
  );
};

export default ImageFocalPoint;
