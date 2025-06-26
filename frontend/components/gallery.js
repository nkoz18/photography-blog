import React, { useEffect } from "react"
import { getStrapiImageUrl } from "../lib/media"
import Image from "./image"
import { getRandomDivider } from "../lib/randomAssets"

const Gallery = ({ images, galleryData }) => {
  // Fix: Move useEffect outside the conditional return to follow React Hooks rules
  useEffect(() => {
    // Add CSS rule to hide captions
    const style = document.createElement("style")
    style.innerHTML = ".uk-lightbox-caption { display: none !important; }"
    document.head.appendChild(style)

    return () => {
      // Clean up function to remove style when component unmounts
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // Handle new gallery structure
  if (galleryData) {
    // First check for gallery items (preferred)
    if (galleryData.gallery_items && galleryData.gallery_items.length > 0) {
      const galleryItems = galleryData.gallery_items
        .map((item, index) => {
          if (!item.image || !item.image.data) return null

          const image = item.image.data
          const displayClass = `gallery-size-${item.display_size || "medium"}`
          const altText =
            item.alt_text ||
            image.attributes?.alternativeText ||
            "Gallery image"

          return (
            <div key={index} className={`gallery-item-wrapper ${displayClass}`}>
              <div className="gallery-item">
                <a
                  className="uk-inline"
                  href={getStrapiImageUrl(image)}
                  data-caption={item.caption || ""}
                >
                  <Image image={{ data: image }} alt={altText} />
                  {item.caption && (
                    <div className="gallery-caption">{item.caption}</div>
                  )}
                </a>
              </div>
            </div>
          )
        })
        .filter(Boolean) // Remove nulls

      if (galleryItems.length > 0) {
        return renderGalleryLayout(galleryItems)
      }
    }

    // Fallback to images field in gallery
    if (
      galleryData.images &&
      galleryData.images.data &&
      galleryData.images.data.length > 0
    ) {
      const galleryItems = galleryData.images.data.map((image, index) => {
        const altText = image.attributes?.alternativeText || "Gallery image"
        return (
          <div key={index} className="gallery-item-wrapper">
            <div className="gallery-item">
              <a
                className="uk-inline"
                href={getStrapiImageUrl(image)}
                data-caption={galleryData.caption || ""}
              >
                <Image image={{ data: image }} alt={altText} />
              </a>
            </div>
          </div>
        )
      })

      return renderGalleryLayout(galleryItems)
    }
  }

  // Legacy support for old structure
  if (!images?.data || images.data.length === 0) return null

  const galleryLegacy = images.data.map((image, index) => {
    const altText = image.attributes?.alternativeText || "Gallery image"
    return (
      <div key={index} className="gallery-item-wrapper">
        <div className="gallery-item">
          <a
            className="uk-inline"
            href={getStrapiImageUrl(image)}
            data-caption="" // Empty caption to prevent showing filename
          >
            <Image image={{ data: image }} alt={altText} />
          </a>
        </div>
      </div>
    )
  })

  return renderGalleryLayout(galleryLegacy)
}

// Helper function to render the gallery layout
const renderGalleryLayout = (galleryItems) => {
  // Get a random divider for this gallery
  const dividerSvg = getRandomDivider()

  return (
    <div className="uk-margin-large-top">
      <div className="random-divider-container">
        <img src={dividerSvg} alt="Divider" className="uk-divider-icon" />
      </div>
      <div
        className="uk-grid uk-child-width-1-3@m uk-child-width-1-2@s uk-child-width-1-1@xs"
        data-uk-grid
        data-uk-lightbox="animation: fade"
        suppressHydrationWarning
      >
        {galleryItems}
      </div>
    </div>
  )
}

export default Gallery
