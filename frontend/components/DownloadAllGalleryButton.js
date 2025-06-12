import React, { useState } from "react"

const DownloadAllGalleryButton = ({ galleryPhotos }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Function to download all images as ZIP
  const downloadAllImages = async () => {
    if (!galleryPhotos || galleryPhotos.length === 0) {
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
      for (let i = 0; i < galleryPhotos.length; i++) {
        const photo = galleryPhotos[i]
        try {
          console.log(`Downloading image ${i + 1}/${galleryPhotos.length}: ${photo.src}`)
          
          const response = await fetch(photo.src)
          if (!response.ok) {
            console.warn(`Failed to download ${photo.imageName}: ${response.status}`)
            continue
          }

          const blob = await response.blob()
          zip.file(photo.imageName || `image-${i + 1}.jpg`, blob)

          // Update progress
          setDownloadProgress(Math.round(((i + 1) / galleryPhotos.length) * 100))
        } catch (error) {
          console.error(`Error downloading ${photo.imageName}:`, error)
        }
      }

      // Generate ZIP file
      console.log("Generating ZIP file...")
      const zipBlob = await zip.generateAsync({ type: "blob" })

      // Create download link
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `gallery-images.zip`
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

  // Don't show button if no images
  if (!galleryPhotos || galleryPhotos.length === 0) {
    return null
  }

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      marginTop: "2rem", 
      marginBottom: "2rem" 
    }}>
      <button
        onClick={downloadAllImages}
        disabled={isDownloading}
        className="download-all-gallery-button"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "0",
          width: "258px",
          height: "99px",
          background: `url('/images/icons/button_bg.svg') no-repeat center center`,
          backgroundSize: "contain",
          color: "white",
          border: "none",
          fontSize: "20px",
          fontFamily: "'Kirang Haerang', cursive",
          fontWeight: "400",
          textTransform: "uppercase",
          cursor: isDownloading ? "not-allowed" : "pointer",
          transition: "transform 0.3s ease, filter 0.3s ease",
          opacity: isDownloading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isDownloading) {
            e.target.style.transform = "scale(1.05)"
            e.target.style.filter = "brightness(1.1)"
          }
        }}
        onMouseLeave={(e) => {
          if (!isDownloading) {
            e.target.style.transform = "scale(1)"
            e.target.style.filter = "brightness(1)"
          }
        }}
      >
        {isDownloading ? (
          <span>
            Downloading... {downloadProgress}%
          </span>
        ) : (
          <>
            <span style={{ marginRight: "8px" }}>
              Download All
            </span>
            <img
              src="/images/icons/download.svg"
              alt="Download"
              style={{
                width: "24px",
                height: "24px",
              }}
              className="download-icon"
            />
          </>
        )}
      </button>


      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default DownloadAllGalleryButton