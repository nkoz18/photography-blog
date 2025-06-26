import React, { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import "photoswipe/dist/photoswipe.css"
import { Gallery as PhotoSwipeGallery, Item } from "react-photoswipe-gallery"
import { motion, AnimatePresence } from "framer-motion"
import { getStrapiURL } from "../lib/api"
import Image from "next/image"
import { getRandomDivider } from "../lib/randomAssets"
import ReportModal from "./ReportModal"
import DownloadAllGalleryButton from "./DownloadAllGalleryButton"

const PhotoSwipeGalleryComponent = ({ galleryData, images, initialIndex = 0, articleSlug }) => {
  const [galleryPhotos, setGalleryPhotos] = useState([])
  const [dividerSvg, setDividerSvg] = useState("")
  const [reportModal, setReportModal] = useState({ isOpen: false, imageId: null, imageName: null })
  const [pswpInstance, setPswpInstance] = useState(null)
  const [currentSlideData, setCurrentSlideData] = useState(null)
  const [shouldOpenAtIndex, setShouldOpenAtIndex] = useState(null)
  const [notification, setNotification] = useState({ show: false, x: 0, y: 0 })

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
    
    // Handle deep linking - URL hash takes priority over initialIndex prop
    let targetIndex = null
    
    // First check for URL hash (#image-n) - this takes priority
    if (typeof window !== 'undefined' && photos.length > 0) {
      const m = window.location.hash.match(/^#image-(\d+)$/)
      if (m) {
        const idx = Number(m[1]) - 1 // slides are 0-based
        if (idx >= 0 && idx < photos.length) {
          targetIndex = idx
        }
      }
    }
    
    // Fall back to initialIndex prop if no hash is present
    if (targetIndex === null && initialIndex > 0 && photos.length > initialIndex) {
      targetIndex = initialIndex
    }
    
    // Set the target index if we have one
    if (targetIndex !== null) {
      setShouldOpenAtIndex(targetIndex)
    }
  }, [processImages, initialIndex])
  
  // Open gallery at specific index when photos are ready
  useEffect(() => {
    if (shouldOpenAtIndex !== null && galleryPhotos.length > 0) {
      // Small delay to ensure gallery is fully rendered
      const timer = setTimeout(() => {
        const targetItem = document.querySelector(`[data-gallery-index="${shouldOpenAtIndex}"]`)
        if (targetItem) {
          targetItem.click()
        }
        setShouldOpenAtIndex(null)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [shouldOpenAtIndex, galleryPhotos])

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
        onOpen={(pswp) => {
          setPswpInstance(pswp)
          
          // Set initial slide data
          const initialIndex = pswp.currIndex || 0
          const initialPhotoData = galleryPhotos[initialIndex]
          if (initialPhotoData) {
            setCurrentSlideData(initialPhotoData)
          }
          
          // Listen for slide changes to track current image
          pswp.on('change', () => {
            const currentIndex = pswp.currIndex
            const currentPhotoData = galleryPhotos[currentIndex]
            console.log('📸 PhotoSwipe Change Event:', {
              currentIndex,
              currentPhotoData: currentPhotoData ? {
                imageId: currentPhotoData.imageId,
                imageName: currentPhotoData.imageName
              } : null,
              totalPhotos: galleryPhotos.length
            })
            if (currentPhotoData) {
              setCurrentSlideData(currentPhotoData)
            }
          })
          
          // Clean up when PhotoSwipe closes
          pswp.on('destroy', () => {
            setCurrentSlideData(null)
            setPswpInstance(null)
          })
        }}
        uiElements={[
          {
            name: "custom-report-button",
            order: 8,
            isButton: true,
            html: `<div class="pswp__icn"></div>`,
            className: "pswp__button--report",
            title: "Report this image",
            ariaLabel: "Report this image",
            onClick: (event, el, pswp) => {
              // Get current slide data directly from PhotoSwipe instance
              const currentIndex = pswp.currIndex
              const currentPhotoData = galleryPhotos[currentIndex]
              
              console.log('🎯 Report Button Clicked:', {
                currentIndex,
                galleryPhotosLength: galleryPhotos.length,
                currentPhotoData: currentPhotoData ? {
                  imageId: currentPhotoData.imageId,
                  imageName: currentPhotoData.imageName
                } : null
              })
              
              if (currentPhotoData && currentPhotoData.imageId) {
                setReportModal({
                  isOpen: true,
                  imageId: currentPhotoData.imageId,
                  imageName: currentPhotoData.imageName
                });
              } else {
                console.error('❌ No current slide data available for report', {
                  currentIndex,
                  galleryPhotosLength: galleryPhotos.length,
                  currentPhotoData
                })
              }
            }
          },
          {
            name: "custom-share-button",
            order: 7,
            isButton: true,
            html: `<div class="pswp__icn"></div>`,
            className: "pswp__button--share",
            title: "Share this image",
            ariaLabel: "Share this image",
            onClick: (event, el, pswp) => {
              const currentIndex = pswp.currIndex
              const imageNumber = currentIndex + 1
              const shareUrl = `${window.location.origin}/article/${articleSlug}#image-${imageNumber}`
              
              // Get cursor position for notification - position to the left of cursor
              const x = event.clientX - 10  // Position to the left of the cursor
              const y = event.clientY
              
              // Copy to clipboard
              if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  // Show notification
                  console.log('📋 Share notification triggered at:', { x, y })
                  setNotification({ show: true, x, y })
                  setTimeout(() => {
                    setNotification({ show: false, x: 0, y: 0 })
                  }, 2000)
                }).catch(() => {
                  // Fallback - open share dialog or show URL
                  prompt('Copy this URL to share:', shareUrl)
                })
              } else {
                // Fallback for older browsers
                prompt('Copy this URL to share:', shareUrl)
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
                    data-gallery-index={index}
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

      {/* Copy Notification - Render to document body to appear above PhotoSwipe */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                left: notification.x,
                top: notification.y,
                transform: 'translateX(-100%) translateY(-50%)',
                backgroundColor: '#ff007f',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '0px',
                fontSize: '14px',
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: '500',
                pointerEvents: 'none',
                zIndex: 999999,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(255, 0, 127, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              Link copied to clipboard!
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
        
        /* Consistent spacing for all PhotoSwipe buttons */
        .pswp__top-bar .pswp__button {
          margin-right: 12px !important;
        }
        
        .pswp__top-bar .pswp__button:last-child {
          margin-right: 0 !important;
        }
        
        /* Share Button - match other PhotoSwipe buttons */
        .pswp__button--share .pswp__icn {
          background: url('/images/icons/share.svg') no-repeat center !important;
          background-size: 32px 32px !important;
          opacity: 0.85 !important;
          transition: opacity 0.2s ease, filter 0.2s ease !important;
        }

        .pswp__button--share:hover .pswp__icn {
          opacity: 1 !important;
          filter: brightness(1.2) !important;
        }
        
        /* Report Button - match other PhotoSwipe buttons */
        .pswp__button--report .pswp__icn {
          background: url('/images/icons/report.svg') no-repeat center !important;
          background-size: 32px 32px !important;
          opacity: 0.85 !important;
          transition: opacity 0.2s ease, filter 0.2s ease !important;
        }

        .pswp__button--report:hover .pswp__icn {
          opacity: 1 !important;
          filter: brightness(1.2) !important;
        }
        
        /* Hide the native download button SVG and use CSS background like other buttons */
        .pswp__button--download .pswp__icn svg {
          display: none !important;
        }

        .pswp__button--download .pswp__icn {
          background: url('/images/icons/download.svg') no-repeat center !important;
          background-size: 36px 36px !important;
          opacity: 0.85 !important;
          transition: opacity 0.2s ease, filter 0.2s ease !important;
          width: 36px !important;
          height: 36px !important;
        }

        .pswp__button--download:hover .pswp__icn {
          opacity: 1 !important;
          filter: brightness(1.2) !important;
        }

        /* Make other icons larger to match report icon height */
        .pswp__button--zoom .pswp__icn,
        .pswp__button--close .pswp__icn {
          background-size: 36px 36px !important;
        }
        
        /* Larger counter font */
        .pswp__counter {
          font-size: 18px !important;
        }
      `}</style>
    </div>
  )
}

export default PhotoSwipeGalleryComponent