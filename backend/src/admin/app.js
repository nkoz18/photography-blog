import ImageFocalPoint from "./extensions/components/ImageFocalPoint";
import BatchImageUpload from "./extensions/components/BatchImageUpload";
import ShareArticleUrl from "./extensions/components/ShareArticleUrl";
import CustomGalleryCSS from "./extensions/components/CustomGalleryCSS";

console.log('app.js: Components imported successfully');
console.log('app.js: ShareArticleUrl type:', typeof ShareArticleUrl);

/**
 * Admin panel customization entry point
 * Registers custom components for the admin UI
 */
export default {
  config: {
    // Keep locales empty to use the default
    locales: [],
  },
  bootstrap(app) {

    // Force dark mode immediately on bootstrap
    const forceDarkMode = () => {
      try {
        localStorage.setItem('strapi-theme', 'dark');
        localStorage.setItem('STRAPI_THEME', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        if (document.body) {
          document.body.setAttribute('data-theme', 'dark');
          document.body.classList.add('theme-dark');
          document.body.classList.remove('theme-light');
        }
      } catch (error) {
        // Silently handle errors
      }
    };
    
    // Apply immediately
    forceDarkMode();
    
    // Apply when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', forceDarkMode);
    } else {
      forceDarkMode();
    }
    
    // Simple one-time theme enforcement without observer to avoid logging spam
    setTimeout(forceDarkMode, 500);
    setTimeout(forceDarkMode, 2000);

    // Register custom components
    app.injectContentManagerComponent("editView", "right-links", {
      name: "image-focal-point",
      Component: ImageFocalPoint,
    });

    app.injectContentManagerComponent("editView", "right-links", {
      name: "batch-image-upload",
      Component: BatchImageUpload,
    });

    console.log('app.js: About to inject ShareArticleUrl component');
    app.injectContentManagerComponent("editView", "right-links", {
      name: "share-article-url",
      Component: ShareArticleUrl,
    });
    console.log('app.js: ShareArticleUrl component injected successfully');

    // Add custom CSS for gallery behavior
    app.injectContentManagerComponent("editView", "right-links", {
      name: "custom-gallery-css",
      Component: CustomGalleryCSS,
    });


    // Custom components registered successfully
  },
};
