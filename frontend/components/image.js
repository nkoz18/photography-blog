import { useState, useEffect } from "react"
import { getStrapiMedia } from "../lib/media"

/**
 * Improved image component that handles focal points for better cropping
 */
const Image = ({ image, style, alt }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState("")
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Only set the image source after component mounts
    if (image?.data?.attributes) {
      const src = getStrapiMedia(image)
      setImgSrc(src)
      setRetryCount(0)
    }
    
    // Cleanup function to revoke blob URLs
    return () => {
      if (imgSrc && imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc)
      }
    }
  }, [image, imgSrc])

  // Function to preload image via fetch to avoid browser caching issues
  const preloadImageViaFetch = async (url) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      console.error('Fetch preload failed:', error)
      return null
    }
  }

  if (!image?.data?.attributes) {
    return null
  }

  const { alternativeText } = image.data.attributes

  // Check if image is in an article cover
  const isArticleCover = image?.data?.attributes?.width > 1000

  // Use provided alt text or fallback
  const altText = alt || alternativeText || ""

  return (
    <div
      className={`image-container ${
        isArticleCover ? "article-cover-image-container" : ""
      }`}
      style={{
        position: "relative",
        paddingBottom: isArticleCover ? 0 : "56.25%",
        height: isArticleCover ? "100%" : 0,
        overflow: "hidden",
        maxWidth: "100%",
      }}
    >
      {isLoading && <div className="image-loader"></div>}
      {hasError && (
        <div className="image-error" style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#999",
          fontSize: "14px"
        }}>
          Image failed to load
        </div>
      )}
      {imgSrc && !hasError && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={altText}
          className={`image-transition ${
            isLoading ? "image-loading" : "image-loaded"
          }`}
          onLoad={() => {
            setIsLoading(false)
            setHasError(false)
          }}
          onError={async (e) => {
            console.error("Image failed to load:", imgSrc, e)
            setIsLoading(false)
            
            if (retryCount < 3) {
              console.log(`Retry attempt ${retryCount + 1}/3 for:`, imgSrc)
              
              // Try using fetch to preload the image first
              const blobUrl = await preloadImageViaFetch(imgSrc)
              if (blobUrl) {
                console.log("Using blob URL:", blobUrl)
                setImgSrc(blobUrl)
                setRetryCount(retryCount + 1)
                setIsLoading(true)
                return
              }
              
              // Fallback: try with cache-busting
              const retryUrl = `${imgSrc.split('?')[0]}?t=${Date.now()}&retry=${retryCount + 1}`
              setTimeout(() => {
                setImgSrc(retryUrl)
                setRetryCount(retryCount + 1)
                setIsLoading(true)
              }, 1000 * (retryCount + 1)) // Exponential backoff
            } else {
              setHasError(true)
            }
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // Remove inline objectPosition, let CSS variable handle it entirely
            // objectPosition: focalPoint
            //   ? `${focalPoint.x}% ${focalPoint.y}%`
            //   : "50% 50%",
          }}
        />
      )}
    </div>
  )
}

export default Image
