import React, { useEffect, useState, useCallback } from "react"
import "photoswipe/dist/photoswipe.css"
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery"
import { motion } from "framer-motion"
import { getStrapiURL } from "../lib/api"
import Image from "next/image"
import { getRandomDivider } from "../lib/randomAssets"
import ReportModal from "./ReportModal"
import DownloadAllGalleryButton from "./DownloadAllGalleryButton"

const PhotoSwipeGalleryComponent = ({ galleryData, images }) => {
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [dividerSvg, setDividerSvg] = useState("")
  const [reportModal, setReportModal] = useState({ isOpen: false, imageId: null, imageName: null })
  const [pswpInstance, setPswpInstance] = useState(null)

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
          .filter((item) => {
            // Handle both direct item.image and item.attributes.image formats
            const imageRef = item.image || item.attributes?.image;
            return item && imageRef && imageRef.data;
          })
          .map((item, index) => {
            // Handle both direct item.image and item.attributes.image formats
            const imageRef = item.image || item.attributes?.image;
            const image = imageRef.data;
            const width = image.attributes?.width || 1200
            const height = image.attributes?.height || 800
            const src = getImageUrl(image)

            return {
              id: `gallery-${image.id || index}`,
              imageId: image.id,
              imageName: image.attributes?.name || `image-${index + 1}`,
              src,
              width,
              height,
              original: src,
              alt: item.alt_text || item.attributes?.alt_text || image.attributes?.alternativeText || "",
              caption: item.caption || item.attributes?.caption || image.attributes?.caption || "",
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
              imageId: image.id,
              imageName: image.attributes?.name || `image-${index + 1}`,
              src,
              width,
              height,
              original: src,
              alt: item.alt_text || item.attributes?.alt_text || image.attributes?.alternativeText || "",
              caption: item.caption || item.attributes?.caption || image.attributes?.caption || "",
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
            imageId: image.id,
            imageName: image.attributes?.name || `image-${index + 1}`,
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
        onOpen={(pswp) => setPswpInstance(pswp)}
        uiElements={[
          {
            name: "custom-report-button",
            order: 7,
            isButton: true,
            html: `<div class="pswp__icn"></div>`,
            className: "pswp__button--report",
            title: "Report this image",
            ariaLabel: "Report this image",
            onClick: (event, el) => {
              const index = pswpInstance?.currIndex || 0;
              const photoData = galleryPhotos[index];
              
              if (photoData && photoData.imageId) {
                setReportModal({
                  isOpen: true,
                  imageId: photoData.imageId,
                  imageName: photoData.imageName
                });
              }
            }
          }
        ]}
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
          downloadURL: (item) => item.src,
          // Fix transparency issue
          bgOpacity: 1,
          loop: false,
          focus: false,
        }}
        downloadProps={{
          download: true,
          target: "_blank",
          rel: "noopener noreferrer",
          title: "Download image"
        }}
      >
        <div className="custom-masonry-grid">
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
                  <motion.div
                    ref={ref}
                    onClick={open}
                    className="gallery-item-container"
                    initial={{ 
                      opacity: 0, 
                      y: 30,
                      scale: 0.95
                    }}
                    whileInView={{ 
                      opacity: 1, 
                      y: 0,
                      scale: 1
                    }}
                    viewport={{ 
                      once: true,  // Only animate once when entering viewport
                      margin: "0px 0px -100px 0px"  // Trigger when item is 100px from entering viewport
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.25, 0.1, 0.25, 1.0] // Custom cubic-bezier
                    }}
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      overflow: "hidden",
                      borderRadius: "0",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: `${photo.width} / ${photo.height}`, // Lock the container to exact image ratio
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <motion.div
                        whileHover={{
                          scale: 1.015, // Very subtle zoom like before
                          transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } // Slow like before
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "block",
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
                            height: "100%",
                            objectFit: "cover", // Ensures image fills container exactly
                            display: "block",
                          }}
                          loading="lazy"
                          unoptimized
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </Item>
            ))}
        </div>
      </PhotoSwipeGallery>

      {/* Download All Button - Static placement at bottom of gallery */}
      <DownloadAllGalleryButton 
        galleryPhotos={galleryPhotos}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        imageId={reportModal.imageId}
        imageName={reportModal.imageName}
        onClose={() => setReportModal({ isOpen: false, imageId: null, imageName: null })}
      />

      {/* Custom CSS to fix PhotoSwipe transparency bug */}
      <style jsx global>{`
        .pswp__img {
          opacity: 1 !important;
          transition: none !important;
        }
        
        .pswp__img--placeholder {
          opacity: 0 !important;
        }
        
        .pswp__container {
          backface-visibility: hidden;
        }
        
        /* Ensure images maintain full opacity */
        .pswp__zoom-wrap {
          opacity: 1 !important;
        }
        
        /* Report Button - match other PhotoSwipe buttons */
        .pswp__button--report .pswp__icn {
          background: url('/images/icons/report.svg') no-repeat center !important;
          background-size: 32px 32px !important;
          opacity: 0.85 !important;
          transition: opacity 0.2s ease, filter 0.2s ease !important;
          margin-left: 8px !important; /* Consistent spacing like zoom button */
        }

        .pswp__button--report:hover .pswp__icn {
          opacity: 1 !important;
          filter: brightness(1.2) !important;
        }
        
        /* Make other icons larger to match report icon height */
        .pswp__button--download .pswp__icn,
        .pswp__button--zoom .pswp__icn,
        .pswp__button--close .pswp__icn {
          background-size: 36px 36px !important;
        }
        
        /* Larger counter font */
        .pswp__counter {
          font-size: 18px !important;
        }
        
        /* Ensure consistent spacing for all PhotoSwipe buttons */
        .pswp__top-bar .pswp__icn {
          margin-left: 8px !important;
        }
      `}</style>
    </div>
  )
}

export default PhotoSwipeGalleryComponent