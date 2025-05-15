import GalleryThumbnails from "./extensions/components/GalleryThumbnails";
import ImageFocalPoint from "./extensions/components/ImageFocalPoint";
import BatchImageUpload from "./extensions/components/BatchImageUpload";

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
      name: "gallery-thumbnails",
      Component: GalleryThumbnails,
    });

    app.injectContentManagerComponent("editView", "right-links", {
      name: "image-focal-point",
      Component: ImageFocalPoint,
    });

    app.injectContentManagerComponent("editView", "right-links", {
      name: "batch-image-upload",
      Component: BatchImageUpload,
    });
  },
};
