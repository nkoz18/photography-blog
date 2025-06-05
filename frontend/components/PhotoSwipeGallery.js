import React, { useEffect, useState, useCallback } from "react"
import "photoswipe/dist/photoswipe.css"
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import { getStrapiURL } from "../lib/api"
import Image from "next/image"
import { getRandomDivider } from "../lib/randomAssets"

const PhotoSwipeGalleryComponent = ({ galleryData, images }) => {
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [dividerSvg, setDividerSvg] = useState("")

  // Get Strapi Image URL helper function
  const getImageUrl = useCallback((image) => {
    if (!image) return ""

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://34.220.121.179:1337"

      // Handle different data structures
      if (image.attributes && image.attributes.url) {
        const { url } = image.attributes

        // For absolute URLs, return as is
        if (url.startsWith("http")) {
          return url
        }

        // Always use full URL with backend domain
        if (url.startsWith("/uploads")) {
          return `${backendUrl}${url}`
        }

        // For other relative URLs
        return getStrapiURL(url)
      } else if (image.url) {
        const { url } = image

        // For absolute URLs, return as is
        if (url.startsWith("http")) {
          return url
        }

        // Always use full URL with backend domain
        if (url.startsWith("/uploads")) {
          return `${backendUrl}${url}`
        }

        // For other relative URLs
        return getStrapiURL(url)
      } else if (
        image.data &&
        image.data.attributes &&
        image.data.attributes.url
      ) {
        const { url } = image.data.attributes

        // For absolute URLs, return as is
        if (url.startsWith("http")) {
          return url
        }

        // Always use full URL with backend domain
        if (url.startsWith("/uploads")) {
          return `${backendUrl}${url}`
        }

        // For other relative URLs
        return getStrapiURL(url)
      }
    } catch (err) {
      console.error("Error getting image URL:", err)
    }

    return ""
  }, [])

  // Process the images from gallery_items
  const processImages = useCallback(() => {
    let processedImages = []

    try {
      // Primary case: gallery_items in galleryData
      if (
        galleryData &&
        galleryData.data &&
        galleryData.data.attributes &&
        galleryData.data.attributes.gallery_items &&
        galleryData.data.attributes.gallery_items.length > 0
      ) {
        processedImages = galleryData.data.attributes.gallery_items
          .filter((item) => item && item.image && item.image.data)
          .map((item, index) => {
            const image = item.image.data
            const width = image.attributes?.width || 1200
            const height = image.attributes?.height || 800
            const src = getImageUrl(image)

            return {
              id: `gallery-${image.id || index}`,
              src,
              width,
              height,
              original: src,
              alt: item.alt_text || image.attributes?.alternativeText || "",
              caption: item.caption || image.attributes?.caption || "",
            }
          })
      }
      // Alternative: Direct galleryData structure (no data wrapper)
      else if (
        galleryData &&
        galleryData.gallery_items &&
        galleryData.gallery_items.length > 0
      ) {
        processedImages = galleryData.gallery_items
          .filter((item) => item && item.image && item.image.data)
          .map((item, index) => {
            const image = item.image.data
            const width = image.attributes?.width || 1200
            const height = image.attributes?.height || 800
            const src = getImageUrl(image)

            return {
              id: `gallery-${image.id || index}`,
              src,
              width,
              height,
              original: src,
              alt: item.alt_text || image.attributes?.alternativeText || "",
              caption: item.caption || image.attributes?.caption || "",
            }
          })
      }
      // Fallback: Legacy images field (for backwards compatibility)
      else if (images && images.data && images.data.length > 0) {
        processedImages = images.data.map((image, index) => {
          const width = image.attributes?.width || 1200
          const height = image.attributes?.height || 800
          const src = getImageUrl(image)

          return {
            id: `gallery-${image.id || index}`,
            src,
            width,
            height,
            original: src,
            alt: image.attributes?.alternativeText || "",
            caption: image.attributes?.caption || "",
          }
        })
      } else {
        console.log("No gallery data found to process")
      }
    } catch (err) {
      console.error("Error processing images:", err)
    }

    return processedImages
  }, [galleryData, images, getImageUrl])

  useEffect(() => {
    const photos = processImages()
    setGalleryPhotos(photos)

    // Select a random divider
    setDividerSvg(getRandomDivider())
  }, [processImages])

  // Return null if no images to display
  if (!galleryPhotos || galleryPhotos.length === 0) {
    return null
  }

  return (
    <div
      className="photo-gallery-container uk-margin-large-top"
      style={{ width: "100%" }}
    >
      <div className="random-divider-container">
        <img src={dividerSvg} alt="Divider" className="uk-divider-icon" />
      </div>
      <PhotoSwipeGallery
        withDownloadButton
        options={{
          showHideAnimationType: "fade",
          clickToCloseNonZoomable: true,
          wheelToZoom: true,
          pinchToClose: false,
          allowPanToNext: true,
          allowMouseDrag: true,
          gestureOpts: {
            allowNativeTouchScrolling: true,
            pinchToZoom: true,
          },
        }}
      >
        <div className="photo-gallery-wrapper" style={{ width: "100%", margin: "0 -10px" }}>
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}
          >
            <Masonry gutter="0">
              {galleryPhotos.map((photo, index) => (
                <Item
                  key={`gallery-item-${index}`}
                  original={photo.original || photo.src}
                  thumbnail={photo.src}
                  width={photo.width}
                  height={photo.height}
                  alt={photo.alt || "Gallery image"}
                  caption={photo.caption || ""}
                >
                  {({ ref, open }) => (
                    <div
                      ref={ref}
                      onClick={open}
                      className="gallery-item-wrapper"
                      style={{
                        position: "relative",
                        cursor: "pointer",
                        overflow: "hidden",
                        borderRadius: "4px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                        transition: "box-shadow 0.3s ease",
                        padding: "10px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      <div
                        style={{
                          overflow: "hidden",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt || "Gallery image"}
                          width={photo.width}
                          height={photo.height}
                          className="gallery-image"
                          style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                          loading="lazy"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                </Item>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        </div>
      </PhotoSwipeGallery>
    </div>
  )
}

export default PhotoSwipeGalleryComponent
