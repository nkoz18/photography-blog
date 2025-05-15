# PhotoSwipe Gallery Implementation Guide

This guide explains the enhanced PhotoSwipe gallery implementation for the Silky Truth photography blog. The new gallery system offers better image viewing, zooming capabilities, and a responsive row layout.

## Features

- **Responsive Row Layout**: Images are arranged in rows that maintain their original aspect ratios
- **Justified Grid System**: Creates a clean, professional look with evenly distributed images
- **Lightbox with Advanced Features**: 
  - Pinch-zoom on mobile devices
  - Scroll-wheel zoom on desktop
  - Swipe navigation between images
  - Download button for original images
- **Improved User Experience**:
  - No hover effects or unwanted movement
  - Images properly fill available space
  - Faster loading with efficient rendering
  - Clean caption display

## How It Works

The gallery uses a combination of:

1. **React Photo Gallery**: For the responsive row layout that maintains aspect ratios
2. **PhotoSwipe Library**: For lightbox functionality and zoom capabilities
3. **Strapi Content Structure**: Your existing gallery items in the CMS

## Gallery Item Sizes

When editing articles in Strapi, each gallery item has a `display_size` setting that influences how much space it gets in the row layout:

- **Small**: Takes up less space in the layout (0.8x normal size)
- **Medium**: Standard size (default)
- **Large**: More prominent images (1.2x normal size)
- **Full**: Featured images (1.5x normal size)

The algorithm will optimize the layout while respecting these size preferences, creating a visually appealing grid that fills each row.

## Row Layout Algorithm

The gallery uses the Knuth and Plass line-breaking algorithm (similar to what's used in LaTeX) to create an optimal layout:

1. It calculates the best way to break images into rows
2. Maintains the original aspect ratio of all images
3. Creates rows of similar heights
4. Prevents "orphaned" images or uneven layouts
5. Adapts to all screen sizes, reorganizing as needed

## Upgrading from Previous Gallery

The new gallery is compatible with all your existing content. It checks for images in three places, in order of preference:

1. The new gallery items structure (preferred)
2. The gallery images field 
3. The legacy images field

For the best experience, we recommend using the gallery items approach with the display_size parameter to control image importance.

## Usage Tips

1. **Varied Image Sizes**: Use a mix of small, medium, large, and full-sized images for visual interest
2. **Image Quality**: Upload high-resolution images to allow for zooming
3. **Aspect Ratios**: The layout works best with a variety of aspect ratios (landscape, portrait, square)
4. **Image Order**: Consider the flow of images - place related images near each other

## Browser Compatibility

The gallery works in all modern browsers:

- Chrome, Firefox, Safari, Edge: Full functionality
- Mobile browsers: Full support including touch gestures
- IE11: Limited support

## Troubleshooting

If you encounter issues:

1. **Layout Problems**: Ensure images have proper width and height dimensions in Strapi
2. **Captions Missing**: Check that captions are correctly entered in the CMS
3. **Inconsistent Sizing**: Try adjusting the display_size settings for more consistent results

## Future Improvements

Future updates may include:

- Additional gallery layouts
- Animation options
- More UI customization options
- Video support

These will be implemented as needed based on your feedback. 