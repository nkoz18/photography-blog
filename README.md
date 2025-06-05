# Silky Truth Photography Blog

A modern photography blog built with Strapi CMS (backend) and Next.js (frontend), featuring advanced image management, dynamic content updates, and creative interactive elements.

## 🚀 Quick Start

See [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for development setup and deployment instructions.

## 📁 Project Structure

```
photography-blog/
├── backend/               # Strapi CMS v4.2.0
├── frontend/              # Next.js v11.0.0  
├── tests/                 # Test suites
├── CLAUDE.md             # AI assistant instructions
└── PROJECT_OVERVIEW.md   # Development guide
```

## Image Focal Point System

The photography blog features a smart focal point system that ensures the most important parts of images remain visible regardless of how they're cropped on different devices.

### How Focal Points Work

1. **Setting Focal Points**: In the Strapi admin panel, content editors can set focal points on images by clicking on the most important area of the image using the ImageFocalPoint component.

2. **Data Storage**: Focal point coordinates are stored as percentages (x, y) in the image's `provider_metadata.focalPoint` field in the database:
   ```json
   "provider_metadata": {
     "focalPoint": {
       "x": 58.39,
       "y": 36.86
     }
   }
   ```

3. **API Integration**: When requesting images through the API, the `provider_metadata` field must be included in the query to retrieve focal point data:
   ```
   /api/articles?populate[image][fields][]=provider_metadata
   ```

4. **Frontend Rendering**: The Image component in the frontend automatically:
   - Detects focal point data in the image attributes
   - Applies CSS `object-position` styling with the focal point coordinates
   - Ensures the focal point stays visible when images are cropped

### Technical Implementation

- **Backend Storage**: Focal points are saved via the `/upload/updateFocalPoint/:id` endpoint
- **CSS Implementation**: The focal point is applied using:
  ```css
  object-fit: cover;
  object-position: 58.39% 36.86%; /* Using the focal point x and y values */
  ```
- **Responsive Design**: This ensures that on all screen sizes and aspect ratios, the most important part of the image remains visible

### Benefits

- Improved visual storytelling by keeping the subject in view
- Better responsive design without manual cropping of images
- Consistent user experience across devices

## 🎯 Key Features

### Advanced Image Management
- **Batch Upload**: Drag-and-drop multiple images at once
- **Focal Points**: Smart cropping that keeps the subject in view
- **PhotoSwipe Galleries**: Beautiful masonry layouts with full-screen viewing
- **AWS S3 Storage**: Scalable cloud storage for all media

### Dynamic Content
- **Live Updates**: CMS changes appear immediately without redeployment
- **Client-Side Fetching**: Fresh content on every page load
- **Static Performance**: Pre-rendered pages for speed

### User Experience
- **Dark Mode**: System-aware theme switching
- **Responsive Design**: Mobile-first approach
- **Performance Optimized**: Lazy loading, code splitting, and image optimization

## Easter Eggs

### Konami Code Easter Egg

The website includes a hidden easter egg triggered by entering the Konami Code (↑ ↑ ↓ ↓ ← → ← → B A).

#### How It Works

1. **Activation**: When a user enters the Konami Code sequence on their keyboard, a character named "Silky" will appear and move across the screen while bobbing up and down.

2. **Technical Implementation**:
   - Uses the `konami` npm package to detect the key sequence
   - Implements smooth animation using `requestAnimationFrame` for both horizontal movement and vertical bobbing
   - Plays a custom sound effect when triggered
   - Supports fallback to SVG icon if the character image is unavailable
   - Works on both desktop and mobile (via touch sequence detection)

3. **Files**:
   - The implementation is in `frontend/components/KonamiEasterEgg.js`
   - Character image: `/public/easter-egg/images/silky.png`
   - Sound effect: `/public/easter-egg/sounds/silky.mp3`

#### Mobile Support

The easter egg can also be triggered on mobile devices by tapping the screen 10 times in quick succession (less than 1.5 seconds between taps).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT