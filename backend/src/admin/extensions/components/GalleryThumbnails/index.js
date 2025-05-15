import React, { useState, useEffect } from "react";
import { useCMEditViewDataManager } from "@strapi/helper-plugin";
import styled from "styled-components";
import { Box } from "@strapi/design-system/Box";
import { Typography } from "@strapi/design-system/Typography";
import {
  Accordion,
  AccordionToggle,
  AccordionContent,
} from "@strapi/design-system/Accordion";

const ThumbnailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
  margin-bottom: 16px;
`;

const Thumbnail = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 2px 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// Add padding to the accordion content
const StyledAccordionContent = styled(AccordionContent)`
  padding: 10px !important;
`;

const GalleryThumbnails = () => {
  const { modifiedData, layout } = useCMEditViewDataManager();
  const [hasGallery, setHasGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    console.log("GalleryThumbnails - modifiedData:", modifiedData);

    if (modifiedData && modifiedData.gallery) {
      let images = [];

      // Check for gallery_items structure
      if (
        modifiedData.gallery.gallery_items &&
        modifiedData.gallery.gallery_items.length > 0
      ) {
        console.log("Found gallery_items:", modifiedData.gallery.gallery_items);

        images = modifiedData.gallery.gallery_items
          .filter((item) => item && item.image)
          .map((item) => {
            // Get URL from different possible structures
            let url = "";
            if (item.image.url) {
              url = item.image.url;
            } else if (
              item.image.data &&
              item.image.data.attributes &&
              item.image.data.attributes.url
            ) {
              url = item.image.data.attributes.url;
            }

            return {
              url,
              caption: item.caption || "",
            };
          })
          .filter((img) => img.url); // Only include images with a URL

        console.log("Processed gallery_items:", images);
        setHasGallery(images.length > 0);
      }
      // Check for images structure
      else if (
        modifiedData.gallery.images &&
        (modifiedData.gallery.images.length > 0 ||
          (modifiedData.gallery.images.data &&
            modifiedData.gallery.images.data.length > 0))
      ) {
        console.log("Found gallery.images:", modifiedData.gallery.images);

        // Handle array of image objects
        if (Array.isArray(modifiedData.gallery.images)) {
          images = modifiedData.gallery.images
            .filter(
              (image) =>
                image && (image.url || (image.data && image.data.attributes))
            )
            .map((image) => {
              let url = "";
              let caption = "";

              if (image.url) {
                url = image.url;
                caption = image.caption || "";
              } else if (image.data && image.data.attributes) {
                url = image.data.attributes.url;
                caption = image.data.attributes.caption || "";
              }

              return { url, caption };
            });
        }
        // Handle data.attributes structure
        else if (modifiedData.gallery.images.data) {
          images = modifiedData.gallery.images.data
            .filter((image) => image && image.attributes)
            .map((image) => ({
              url: image.attributes.url,
              caption: image.attributes.caption || "",
            }));
        }

        console.log("Processed gallery.images:", images);
        setHasGallery(images.length > 0);
      } else {
        console.log("No gallery images found");
        setHasGallery(false);
      }

      setGalleryImages(images);
    } else {
      console.log("No gallery data found");
      setHasGallery(false);
      setGalleryImages([]);
    }
  }, [modifiedData]);

  if (!hasGallery) {
    return null;
  }

  return (
    <Box padding={4} background="neutral0" shadow="tableShadow" marginTop={6}>
      <Accordion
        expanded={expanded}
        onToggle={() => setExpanded((prevState) => !prevState)}
        id="gallery-thumbnails-accordion"
      >
        <AccordionToggle
          title="Gallery Images"
          description={`${galleryImages.length} image${
            galleryImages.length !== 1 ? "s" : ""
          }`}
        />
        <StyledAccordionContent>
          <Typography variant="omega">All images in this gallery:</Typography>
          <ThumbnailsContainer>
            {galleryImages.map((image, index) => (
              <Thumbnail key={`thumb-${index}`}>
                <img src={image.url} alt="" />
                {image.caption && (
                  <div className="caption">{image.caption}</div>
                )}
              </Thumbnail>
            ))}
          </ThumbnailsContainer>
        </StyledAccordionContent>
      </Accordion>
    </Box>
  );
};

export default GalleryThumbnails;
