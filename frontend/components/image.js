import { useState, useEffect } from "react"
import { getStrapiMedia, getFocalPointImageUrl } from "../lib/media"

/**
 * Improved image component that handles focal points for better cropping
 * and uses fetch + blob to avoid mixed content issues in HTTPS environments
 */
const Image = ({ image, style, alt }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState("")
  const [blobUrl, setBlobUrl] = useState("")

  useEffect(() => {
    // Debug log the full image data
    console.log("Image component - Full image data:", image?.data?.attributes)

    // Log provider_metadata specifically
    if (image?.data?.attributes?.provider_metadata) {
      console.log(
        "Image component - provider_metadata:",
        image.data.attributes.provider_metadata
      )

      // Log focal point if it exists in provider_metadata
      if (image.data.attributes.provider_metadata.focalPoint) {
        console.log(
          "Image component - Found focal point in provider_metadata:",
          image.data.attributes.provider_metadata.focalPoint
        )
      }
    }

    // Only set the image source after component mounts
    if (image?.data?.attributes) {
      let src = ""

      // Check for focal point data
      if (
        image.data.attributes.provider_metadata?.focalPoint ||
        image.data.attributes.formats?.focalPoint
      ) {
        // Use focal point image URL
        src = getFocalPointImageUrl(image.data)
      } else {
        // Use regular media URL
        src = getStrapiMedia(image)
      }

      setImgSrc(src)

      // Fetch the image and convert to blob URL to avoid mixed content issues
      if (src && typeof window !== "undefined") {
        const fetchImage = async () => {
          try {
            const response = await fetch(src, { mode: "cors" })
            if (!response.ok) {
              console.error("Failed to fetch image:", response.status)
              return
            }

            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            setBlobUrl(objectUrl)
          } catch (error) {
            console.error("Error fetching image:", error)
          }
        }

        fetchImage()
      }
    }

    // Clean up blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [image, blobUrl])

  if (!image?.data?.attributes) {
    return null
  }

  const { alternativeText } = image.data.attributes

  // Get focal point from wherever it exists
  const focalPoint =
    image.data.attributes.formats?.focalPoint ||
    image.data.attributes.provider_metadata?.focalPoint

  // Log the focal point we're using
  if (focalPoint) {
    console.log("Image component - Using focal point:", focalPoint)
  }

  // Check if image is in an article cover
  const isArticleCover = image?.data?.attributes?.width > 1000

  // Use provided alt text or fallback
  const altText = alt || alternativeText || ""

  // Use the blob URL if available, otherwise fall back to the original source
  const displaySrc = blobUrl || imgSrc

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
      {displaySrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displaySrc}
          alt={altText}
          className={`image-transition ${
            isLoading ? "image-loading" : "image-loaded"
          }`}
          onLoad={() => setIsLoading(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: focalPoint
              ? `${focalPoint.x}% ${focalPoint.y}%`
              : "50% 50%",
          }}
        />
      )}
    </div>
  )
}

export default Image
