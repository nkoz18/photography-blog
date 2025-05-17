import React, { useEffect, useState, useCallback, useRef } from "react"
import "photoswipe/dist/photoswipe.css"
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery"
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"
import { getStrapiURL } from "../lib/api"
import Image from "next/image"
import { getRandomDivider } from "../lib/randomAssets"

const PhotoSwipeGalleryComponent = ({ galleryData, images }) => {
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [dividerSvg, setDividerSvg] = useState("")
  const [blobUrls, setBlobUrls] = useState({})
  const blobUrlsRef = useRef({})

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

  // Fetch and create blob URLs to avoid mixed content issues
  const fetchImageAsBlob = useCallback(async (url, id) => {
    if (!url || blobUrlsRef.current[id]) return blobUrlsRef.current[id]

    try {
      const response = await fetch(url, { mode: "cors" })
      if (!response.ok) {
        console.error("Failed to fetch image:", response.status)
        return url
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      blobUrlsRef.current = {
        ...blobUrlsRef.current,
        [id]: objectUrl,
      }

      setBlobUrls((prev) => ({
        ...prev,
        [id]: objectUrl,
      }))

      return objectUrl
    } catch (error) {
      console.error("Error fetching image as blob:", error)
      return url
    }
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
            const id = `gallery-${image.id || index}`

            // Fetch the image as blob in the background
            if (typeof window !== "undefined") {
              fetchImageAsBlob(src, id)
            }

            return {
              id,
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
            const id = `gallery-${image.id || index}`

            // Fetch the image as blob in the background
            if (typeof window !== "undefined") {
              fetchImageAsBlob(src, id)
            }

            return {
              id,
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
          const id = `gallery-${image.id || index}`

          // Fetch the image as blob in the background
          if (typeof window !== "undefined") {
            fetchImageAsBlob(src, id)
          }

          return {
            id,
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
  }, [galleryData, images, getImageUrl, fetchImageAsBlob])

  useEffect(() => {
    const photos = processImages()
    setGalleryPhotos(photos)

    // Select a random divider
    setDividerSvg(getRandomDivider())

    // Clean up blob URLs when component unmounts
    return () => {
      Object.values(blobUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [processImages])

  // Return null if no images to display
  if (!galleryPhotos || galleryPhotos.length === 0) {
    return null
  }

  // Function to get the display URL (blob or original)
  const getDisplayUrl = (photo) => {
    return blobUrls[photo.id] || photo.src
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
        <div className="photo-gallery-wrapper" style={{ width: "100%" }}>
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 1, 750: 2, 900: 3, 1200: 4 }}
          >
            <Masonry gutter="10px">
              {galleryPhotos.map((photo, index) => (
                <Item
                  key={`gallery-item-${index}`}
                  original={blobUrls[photo.id] || photo.original || photo.src}
                  thumbnail={getDisplayUrl(photo)}
                  width={photo.width}
                  height={photo.height}
                  alt={photo.alt || "Gallery image"}
                  caption={photo.caption || ""}
                >
                  {({ ref, open }) => (
                    <div
                      ref={ref}
                      onClick={open}
                      style={{
                        position: "relative",
                        cursor: "pointer",
                        overflow: "hidden",
                        marginBottom: "10px",
                      }}
                    >
                      <Image
                        src={getDisplayUrl(photo)}
                        alt={photo.alt || "Gallery image"}
                        width={photo.width}
                        height={photo.height}
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block",
                        }}
                        loading="lazy"
                        unoptimized
                      />
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
