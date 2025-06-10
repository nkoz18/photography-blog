import React, { useState, useCallback } from "react"
import { getStrapiURL } from "../lib/api"

const DownloadAllButton = ({ galleryData, images, articleTitle }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

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

  // Process the images to get all gallery images
  const getAllImages = useCallback(() => {
    let allImages = []

    try {
      // Primary case: gallery_items in galleryData
      if (
        galleryData &&
        galleryData.data &&
        galleryData.data.attributes &&
        galleryData.data.attributes.gallery_items &&
        galleryData.data.attributes.gallery_items.length > 0
      ) {
        allImages = galleryData.data.attributes.gallery_items
          .filter((item) => item && item.image && item.image.data)
          .map((item, index) => {
            const image = item.image.data
            const src = getImageUrl(image)
            const filename = image.attributes?.name || `image-${index + 1}.jpg`

            return {
              url: src,
              filename: filename,
              alt: item.alt_text || image.attributes?.alternativeText || "",
            }
          })
      }
      // Alternative: Direct galleryData structure (no data wrapper)
      else if (
        galleryData &&
        galleryData.gallery_items &&
        galleryData.gallery_items.length > 0
      ) {
        allImages = galleryData.gallery_items
          .filter((item) => item && item.image && item.image.data)
          .map((item, index) => {
            const image = item.image.data
            const src = getImageUrl(image)
            const filename = image.attributes?.name || `image-${index + 1}.jpg`

            return {
              url: src,
              filename: filename,
              alt: item.alt_text || image.attributes?.alternativeText || "",
            }
          })
      }
      // Fallback: Legacy images field (for backwards compatibility)
      else if (images && images.data && images.data.length > 0) {
        allImages = images.data.map((image, index) => {
          const src = getImageUrl(image)
          const filename = image.attributes?.name || `image-${index + 1}.jpg`

          return {
            url: src,
            filename: filename,
            alt: image.attributes?.alternativeText || "",
          }
        })
      }
    } catch (err) {
      console.error("Error processing images for download:", err)
    }

    return allImages
  }, [galleryData, images, getImageUrl])

  // Function to download all images as ZIP
  const downloadAllImages = async () => {
    const allImages = getAllImages()
    
    if (allImages.length === 0) {
      alert("No images found to download")
      return
    }

    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Download each image and add to ZIP
      for (let i = 0; i < allImages.length; i++) {
        const image = allImages[i]
        try {
          console.log(`Downloading image ${i + 1}/${allImages.length}: ${image.url}`)
          
          const response = await fetch(image.url)
          if (!response.ok) {
            console.warn(`Failed to download ${image.filename}: ${response.status}`)
            continue
          }

          const blob = await response.blob()
          zip.file(image.filename, blob)

          // Update progress
          setDownloadProgress(Math.round(((i + 1) / allImages.length) * 100))
        } catch (error) {
          console.error(`Error downloading ${image.filename}:`, error)
        }
      }

      // Generate ZIP file
      console.log("Generating ZIP file...")
      const zipBlob = await zip.generateAsync({ type: "blob" })

      // Create download link
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${articleTitle || 'gallery'}-images.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log("Download completed successfully")
    } catch (error) {
      console.error("Error creating ZIP file:", error)
      alert("Failed to create ZIP file. Please try again.")
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }

  const allImages = getAllImages()
  
  // Don't show button if no images
  if (allImages.length === 0) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
      }}
    >
      <button
        onClick={downloadAllImages}
        disabled={isDownloading}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: isDownloading ? "#ccc" : "#ff007f",
          color: "white",
          cursor: isDownloading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!isDownloading) {
            e.target.style.backgroundColor = "#e6006b"
            e.target.style.transform = "scale(1.1)"
          }
        }}
        onMouseLeave={(e) => {
          if (!isDownloading) {
            e.target.style.backgroundColor = "#ff007f"
            e.target.style.transform = "scale(1)"
          }
        }}
        title={isDownloading ? `Downloading... ${downloadProgress}%` : `Download all ${allImages.length} images`}
      >
        {isDownloading ? (
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #fff",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        ) : (
          <img
            src="/images/icons/download_all.svg"
            alt="Download All"
            style={{
              width: "28px",
              height: "28px",
              filter: "invert(1)",
            }}
          />
        )}
      </button>

      {/* Progress indicator */}
      {isDownloading && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          {downloadProgress}% ({allImages.length} images)
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default DownloadAllButton