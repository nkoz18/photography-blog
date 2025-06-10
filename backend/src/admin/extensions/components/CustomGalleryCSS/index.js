import React, { useEffect } from 'react';

const CustomGalleryCSS = () => {
  useEffect(() => {
    // Add custom CSS to override gallery accordion behavior
    const style = document.createElement('style');
    style.textContent = `
      /* Force gallery items to be expanded by default */
      [data-strapi-field*="gallery_items"] .accordion-item:not(.expanded) .accordion-content {
        display: block !important;
        height: auto !important;
        opacity: 1 !important;
      }
      
      /* Keep accordion toggle functional but start expanded */
      [data-strapi-field*="gallery_items"] .accordion-item {
        border: 1px solid #dcdce4;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      
      /* Auto-expand all gallery items on page load */
      [data-strapi-field*="gallery_items"] .accordion-toggle {
        cursor: pointer;
      }
      
      /* Show all gallery content by default */
      [data-strapi-field*="gallery_items"] .field-container {
        display: block !important;
      }
    `;
    
    document.head.appendChild(style);
    
    // Auto-expand gallery items when they're rendered
    const expandGalleryItems = () => {
      const galleryFields = document.querySelectorAll('[data-strapi-field*="gallery_items"]');
      galleryFields.forEach(field => {
        const accordionToggles = field.querySelectorAll('[aria-expanded="false"]');
        accordionToggles.forEach(toggle => {
          try {
            toggle.click();
          } catch (e) {
            // Ignore errors if clicking doesn't work
          }
        });
      });
    };
    
    // Run expansion after a short delay to let components render
    setTimeout(expandGalleryItems, 1000);
    
    // Also run when the DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(expandGalleryItems, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      document.head.removeChild(style);
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default CustomGalleryCSS;