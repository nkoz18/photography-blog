import { useState, useEffect, useRef } from "react"
import { getStrapiMedia } from "../lib/media"

/**
 * Improved image component that handles focal points for better cropping
 */
const Image = ({ image, style, alt }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState("")
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const imageRef = useRef(null)

  // Extract focal point from image metadata
  const getFocalPoint = () => {
    if (!image?.data?.attributes) return null
    
    // Try multiple locations for focal point data
    const attrs = image.data.attributes
    let focalPoint = null
    
    // Check provider_metadata.focalPoint (primary location)
    if (attrs.provider_metadata?.focalPoint) {
      focalPoint = attrs.provider_metadata.focalPoint
    }
    // Check formats.focalPoint (alternative location)
    else if (attrs.formats?.focalPoint) {
      focalPoint = attrs.formats.focalPoint
    }
    // Check direct focalPoint property
    else if (attrs.focalPoint) {
      focalPoint = attrs.focalPoint
    }
    
    // Validate focal point data
    if (focalPoint && typeof focalPoint.x === 'number' && typeof focalPoint.y === 'number') {
      // Clamp values to 0-100 range to prevent out-of-bounds positioning
      const x = Math.max(0, Math.min(100, focalPoint.x))
      const y = Math.max(0, Math.min(100, focalPoint.y))
      return { x, y }
    }
    
    return null
  }

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
        width: "100%",
        height: "auto", // Let height be determined by image aspect ratio
        maxWidth: "100%",
      }}
    >
      {isLoading && !isArticleCover && (
        <div style={{
          width: "100%",
          paddingBottom: "56.25%", // 16:9 aspect ratio placeholder while loading
          backgroundColor: "#f5f5f5",
          backgroundImage: "url('/loader.gif')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "50px 50px"
        }}></div>
      )}
      {isLoading && isArticleCover && <div className="image-loader"></div>}
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
          ref={imageRef}
          src={imgSrc}
          alt={altText}
          className={`image-transition ${
            isLoading ? "image-loading" : "image-loaded"
          }`}
          onLoad={() => {
            setIsLoading(false)
            setHasError(false)
            
            // Apply focal point positioning after image loads
            const focalPoint = getFocalPoint()
            if (focalPoint && imageRef.current && isArticleCover) {
              const focalPointValue = `${focalPoint.x}% ${focalPoint.y}%`
              // Set the CSS custom property that the stylesheet expects
              imageRef.current.style.setProperty('--focal-point', focalPointValue)
              
              // Debug logging
              const imageRect = imageRef.current.getBoundingClientRect()
              console.log(`Applied focal point: ${focalPointValue}`)
              console.log(`Image dimensions: ${imageRect.width}x${imageRect.height}`)
              console.log(`Window dimensions: ${window.innerWidth}x${window.innerHeight}`)
              console.log(`Is mobile viewport:`, window.innerWidth <= 768)
            }
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
          style={isArticleCover ? {
            // For article cover images: let CSS handle responsive heights
            width: "100%",
            maxWidth: "100%", 
            display: "block",
            objectFit: "cover"
          } : {
            // For thumbnail images: maintain natural aspect ratio
            width: "100%",
            height: "auto",
            maxWidth: "100%",
            display: "block",
          }}
        />
      )}
    </div>
  )
}

export default Image
