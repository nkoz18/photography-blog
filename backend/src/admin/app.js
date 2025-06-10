import ImageFocalPoint from "./extensions/components/ImageFocalPoint";
import BatchImageUpload from "./extensions/components/BatchImageUpload";
import ShareWithClient from "./extensions/components/ShareWithClient";
import CustomGalleryCSS from "./extensions/components/CustomGalleryCSS";
import ReportsManagement from "./extensions/components/ReportsManagement";

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
    console.log("Admin panel bootstrap");

    // Register custom components
    app.injectContentManagerComponent("editView", "right-links", {
      name: "image-focal-point",
      Component: ImageFocalPoint,
    });

    app.injectContentManagerComponent("editView", "right-links", {
      name: "batch-image-upload",
      Component: BatchImageUpload,
    });

    app.injectContentManagerComponent("editView", "right-links", {
      name: "share-with-client",
      Component: ShareWithClient,
    });

    // Add custom CSS for gallery behavior
    app.injectContentManagerComponent("editView", "right-links", {
      name: "custom-gallery-css",
      Component: CustomGalleryCSS,
    });

    // Add Reports Management to the main menu (simpler approach)
    console.log('Registering Reports Management component');
  },
};
