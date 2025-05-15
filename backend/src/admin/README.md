# Photography Blog - Admin Extensions

This directory contains custom admin extensions for the Photography Blog CMS.

## Extensions

### Gallery Thumbnails
The Gallery Thumbnails component provides a way to see all images in a gallery at once, even when the gallery accordion is closed in the CMS editor. This helps content editors visualize the entire gallery while working on an article.

Features:
- Displays thumbnails of all images in the gallery
- Shows captions underneath thumbnails
- Works with both the new gallery_items structure and the legacy images field

### Image Focal Point Selector
The Image Focal Point Selector allows content editors to specify which part of an image should remain visible when the image is cropped (e.g., on mobile devices or in thumbnails).

Features:
- Click on any part of the image to set a focal point
- Manually adjust focal point coordinates with number inputs
- Visual indicator showing the current focal point
- Saves focal point data in the image metadata

## Usage

### Gallery Thumbnails
1. Add a gallery to an article using either the gallery_items repeatable component or the images field
2. The thumbnails panel will automatically appear in the right sidebar when editing an article with a gallery

### Image Focal Point
1. Add a featured image to an article
2. The focal point selector will appear in the right sidebar
3. Click on the important part of the image that should remain visible when cropped
4. Click "Save Focal Point" to store the focal point data

## Technical Implementation
These extensions use Strapi's admin customization API to inject components into the right sidebar of the content editor. The focal point data is stored in the image metadata and can be used when rendering images in the frontend. 