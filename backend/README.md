# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/developer-docs/latest/developer-resources/cli/CLI.html#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project. Find the one that suits you on the [deployment section of the documentation](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html).

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://docs.strapi.io) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>

# Photography Blog Backend

This is the Strapi backend for the photography blog. It includes custom functionality for image management and gallery creation.

## Features

### Batch Image Upload

We've implemented a custom batch upload feature that allows uploading multiple images at once directly to an article's gallery.

#### Implementation Details

The batch upload feature consists of three main components:

1. **Custom API Endpoint**: 
   - Route: `POST /api/articles/:id/batch-upload`
   - This endpoint accepts multiple files and automatically adds them to the article's gallery.
   - The route is defined in `src/api/article/routes/custom-article.js`

2. **Controller Logic**:
   - Implemented in `src/api/article/controllers/article.js`
   - The `batchUploadGalleryImages` method handles:
     - File uploads to the media library
     - Creating gallery item entries for each uploaded image
     - Updating the article with the new gallery items

3. **Admin UI Component**:
   - Component: `src/admin/extensions/components/BatchImageUpload/index.js`
   - Provides a drag-and-drop interface for selecting multiple images
   - Automatically uploads files and refreshes the gallery view

### How It Works

1. The user selects an article to edit in the Strapi admin panel
2. In the right sidebar, they see the "Batch Upload Gallery Images" component
3. They can drag and drop multiple images or click to select files
4. Upon clicking "Upload to Gallery", the files are sent to the custom endpoint
5. The backend processes the files, uploads them to the media library, and adds them to the article's gallery
6. The page refreshes to show the updated gallery

### Key Technical Solutions

- **Component Structure**: Used Strapi's component system to create reusable `gallery-item` components
- **Public API Endpoint**: Configured as a public endpoint (no authentication required) for simplicity
- **Direct Media Upload**: Leveraged Strapi's built-in upload plugin services
- **Optimized Gallery Updates**: Updates the entire gallery structure in a single database operation
- **Multiple File Handling**: Properly handles arrays of files from the FormData object to ensure true batch upload capability

### Image Focal Point

We've implemented a custom focal point feature that allows setting the focal point of images for responsive display.

#### Implementation Details

1. **Admin UI Component**:
   - Component: `src/admin/extensions/components/ImageFocalPoint/index.js`
   - Provides a visual interface for setting the focal point of an image
   - Shows a red dot indicator for the current focal point position

2. **Data Storage**:
   - Focal point coordinates are stored as percentage values (x, y) in the image's provider_metadata
   - These values can be used in the frontend to properly crop and position images

3. **API Integration**:
   - Custom endpoint for updating focal points
   - Integration with the Strapi upload plugin

## Development

### Important Files

- `src/components/sections/image-gallery.json` - Gallery component schema
- `src/components/sections/gallery-item.json` - Gallery item component schema
- `src/api/article/routes/custom-article.js` - Custom route definition
- `src/api/article/controllers/article.js` - Custom controller logic
- `src/admin/extensions/components/BatchImageUpload/index.js` - Admin UI component
- `src/admin/extensions/components/ImageFocalPoint/index.js` - Focal point component

## Recent Updates

### May 2025 Updates

1. **Batch Upload Improvements**:
   - Fixed an issue where only one image at a time was being uploaded despite selecting multiple files
   - Refactored the backend controller to properly handle arrays of files from FormData
   - Improved error handling and logging for better debugging

2. **Focal Point Enhancement**:
   - Simplified the focal point UI to only show the visual indicator
   - Fixed issues with focal point coordinates being saved correctly
   - Ensured frontend can properly apply the focal point data

### Known Issues

- No known issues at this time. All features are functioning as expected.

## Planned Features

- Image cropping and resizing capabilities
- Advanced gallery layout options
- Integration with frontend image lazy loading
