import React, { useEffect, useState } from 'react';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';

const CustomGalleryCSS = () => {
  const { modifiedData } = useCMEditViewDataManager();
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    // Only run on article edit pages
    const currentUrl = window.location.href;
    const isArticleEditPage = currentUrl.includes('/content-manager/collectionType/api::article.article/');
    
    if (!isArticleEditPage) {
      return;
    }
    
    // Inject CSS for image preview styling - simple selectors that work
    const style = document.createElement('style');
    style.textContent = `
      /* Base styles for gallery preview images - dark mode compatible */
      .gallery-preview-image {
        height: 280px !important;
        width: auto !important;
        object-fit: contain !important;
        border-radius: 4px !important;
        border: 2px solid #32324d !important;
        display: block !important;
        max-width: 90% !important;
        background-color: #181826 !important;
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
      }
      
      /* Style for gallery accordion buttons - dark mode compatible */
      .gallery-accordion-button {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        height: 300px !important;
        min-height: 300px !important;
        max-height: 300px !important;
        padding: 16px 20px !important;
        background-color: #212134 !important;
        border-left: 4px solid #4945ff !important;
        position: relative !important;
        border: 1px solid #32324d !important;
        border-radius: 4px !important;
      }
      
      /* Style for gallery accordion parents */
      .gallery-accordion-parent {
        height: 300px !important;
        min-height: 300px !important;
        max-height: 300px !important;
        overflow: visible !important;
      }
      
      /* Ensure the button text is positioned properly - dark mode compatible */
      .gallery-accordion-button span {
        position: absolute !important;
        top: 10px !important;
        left: 10px !important;
        background: rgba(33, 33, 52, 0.9) !important;
        color: #a5a5ba !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        z-index: 10 !important;
        max-width: 200px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        border: 1px solid #32324d !important;
      }
      
      /* Ensure sidebar widgets don't overlap and have proper containment */
      .edit-view__right-links > div {
        position: relative !important;
        overflow: visible !important;
        margin-bottom: 16px !important;
      }
      
      /* Specific fix for focal point widget container */
      #focal-point-accordion {
        position: relative !important;
        z-index: 1 !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Function to apply styling to gallery accordion elements
    const applyGalleryStyles = () => {
      const galleryButtons = document.querySelectorAll('button[aria-controls^="accordion-content-gallery.gallery_items"]');
      
      galleryButtons.forEach((button, index) => {
        // Add class to button
        button.classList.add('gallery-accordion-button');
        
        // Go up 2 parent levels to find the main container 
        // button -> parent -> parent.parent (the main accordion item container)
        const parentContainer = button.parentElement?.parentElement;
        if (parentContainer) {
          parentContainer.classList.add('gallery-accordion-parent');
        }
      });
    };
    
    // Apply styles immediately
    setTimeout(applyGalleryStyles, 100);
    
    // Set up observer to reapply styles when DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(applyGalleryStyles, 100);
    });
    
    // Also apply styles periodically to ensure they stick
    const interval = setInterval(applyGalleryStyles, 1000);
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      document.head.removeChild(style);
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Extract gallery data using the same logic as the working GalleryThumbnails component
  useEffect(() => {

    if (modifiedData && modifiedData.gallery) {
      let images = [];

      // Check for gallery_items structure (same as working GalleryThumbnails)
      if (modifiedData.gallery.gallery_items && modifiedData.gallery.gallery_items.length > 0) {

        images = modifiedData.gallery.gallery_items
          .filter((item) => item && item.image)
          .map((item) => {
            // Get URL from different possible structures
            let url = "";
            if (item.image.url) {
              url = item.image.url;
            } else if (item.image.data && item.image.data.attributes && item.image.data.attributes.url) {
              url = item.image.data.attributes.url;
            }

            return {
              url,
              caption: item.caption || "",
              image: item.image // Keep full image object for building proxy URLs
            };
          })
          .filter((img) => img.url); // Only include images with a URL
      }
      // Check for images structure (fallback, same as working GalleryThumbnails)
      else if (modifiedData.gallery.images && 
               (modifiedData.gallery.images.length > 0 || 
                (modifiedData.gallery.images.data && modifiedData.gallery.images.data.length > 0))) {

        // Handle array of image objects
        if (Array.isArray(modifiedData.gallery.images)) {
          images = modifiedData.gallery.images
            .filter((image) => image && (image.url || (image.data && image.data.attributes)))
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

              return { url, caption, image };
            });
        }
        // Handle data.attributes structure
        else if (modifiedData.gallery.images.data) {
          images = modifiedData.gallery.images.data
            .filter((image) => image && image.attributes)
            .map((image) => ({
              url: image.attributes.url,
              caption: image.attributes.caption || "",
              image
            }));
        }
      }

      setGalleryImages(images);
    } else {
      setGalleryImages([]);
    }
  }, [modifiedData]);
    
  // Function to inject gallery images using extracted gallery data
  useEffect(() => {
    // Only run image injection on article edit pages
    const currentUrl = window.location.href;
    const isArticleEditPage = currentUrl.includes('/content-manager/collectionType/api::article.article/');
    
    if (!isArticleEditPage) {
      return;
    }
    
    if (galleryImages.length === 0) return;
    
    const injectImages = () => {
      // Target gallery buttons directly since Strapi doesn't use data-strapi-field-name="gallery"
      const galleryButtons = document.querySelectorAll('button[aria-controls^="accordion-content-gallery.gallery_items"]');
      
      
      galleryButtons.forEach((button, index) => {
        try {
          // Skip if we've already injected an image
          if (button.querySelector('.gallery-preview-image')) {
            return;
          }
          
          // Get corresponding gallery item from extracted data
          const galleryItem = galleryImages[index];
          if (!galleryItem || !galleryItem.image) {
            return;
          }
          
          // Build image URL - use direct URLs for local development
          const imageData = galleryItem.image;
          let imageUrl = null;
          
          // Check if we're in local development (localhost)
          const isLocal = window.location.hostname === 'localhost';
          
          // Try thumbnail first, then fall back to full image
          if (imageData.formats?.thumbnail?.url) {
            if (isLocal && imageData.formats.thumbnail.url.startsWith('/uploads/')) {
              // Use direct URL for local images
              imageUrl = imageData.formats.thumbnail.url;
            } else {
              // Use proxy for S3 images
              const thumbnailPath = imageData.formats.thumbnail.url.split('/').pop();
              imageUrl = `/api/image-proxy/${thumbnailPath}`;
            }
          } else if (imageData.url) {
            if (isLocal && imageData.url.startsWith('/uploads/')) {
              // Use direct URL for local images
              imageUrl = imageData.url;
            } else {
              // Use proxy for S3 images
              const imagePath = imageData.url.split('/').pop();
              imageUrl = `/api/image-proxy/${imagePath}`;
            }
          }
          
          if (imageUrl) {
            const previewImg = document.createElement('img');
            previewImg.src = imageUrl;
            previewImg.className = 'gallery-preview-image';
            previewImg.alt = `${imageData.alternativeText || galleryItem.caption || 'Gallery item'} ${index + 1}`;
            previewImg.onerror = function() {
              this.style.display = 'none';
            };
            
            // Append the image to the button
            button.appendChild(previewImg);
          }
        } catch (error) {
          // Silently handle errors
        }
      });
    };

    // Run injection after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(injectImages, 500);
    
    // Also run on DOM mutations (when gallery accordion buttons are added)
    const observer = new MutationObserver((mutations) => {
      let shouldReinject = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const hasGalleryContent = Array.from(mutation.addedNodes).some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.querySelector && node.querySelector('button[aria-controls^="accordion-content-gallery.gallery_items"]'))
          );
          if (hasGalleryContent) {
            shouldReinject = true;
          }
        }
      });
      
      if (shouldReinject) {
        setTimeout(injectImages, 300);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [galleryImages]);

  return null;
};

export default CustomGalleryCSS;