import { useState, useEffect } from "react"
import { getStrapiMedia, getFocalPointImageUrl } from "../lib/media"

/**
 * Improved image component that handles focal points for better cropping
 */
const Image = ({ image, style, alt }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState("")

  useEffect(() => {
    // Only set the image source after component mounts
    // This ensures proper hydration in Next.js
    if (image?.data?.attributes) {
      // Check if image has focal point data
      if (image.data.attributes.formats?.focalPoint) {
        // Use getFocalPointImageUrl when focal point is available
        const src = getFocalPointImageUrl(image.data)
        setImgSrc(src)
      } else {
        // Use regular media URL when no focal point
        const src = getStrapiMedia(image)
        setImgSrc(src)
      }
    }
  }, [image])

  if (!image?.data?.attributes) {
    return null // Don't render anything if no image is available
  }

  const { alternativeText, formats } = image.data.attributes

  // Check if the image has focal point data
  const hasFocalPoint = formats && formats.focalPoint
  const focalPointStyle = hasFocalPoint
    ? getFocalPointStyle(formats.focalPoint)
    : {}

  // Merge any provided styles with focal point styles
  const combinedStyle = {
    ...focalPointStyle,
    ...style,
  }

  // Check if image is in an article cover
  const isArticleCover = image?.data?.attributes?.width > 1000 // Assuming larger images are cover images

  // Use provided alt text or fallback to image's alternativeText
  const altText = alt || alternativeText || ""

  return (
    <div
      className={`image-container ${
        isArticleCover ? "article-cover-image-container" : ""
      }`}
      style={{
        position: "relative",
        paddingBottom: isArticleCover ? 0 : "56.25%", // Only use aspect ratio for non-cover images
        height: isArticleCover ? "100%" : 0,
        overflow: "hidden",
        maxWidth: "100%",
      }}
    >
      {isLoading && <div className="image-loader"></div>}
      {imgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={altText}
          className={`image-transition ${
            isLoading ? "image-loading" : "image-loaded"
          }`}
          onLoad={() => setIsLoading(false)}
          style={{
            ...combinedStyle,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover", // Force this to override any potential conflicting styles
            objectPosition: hasFocalPoint
              ? `${formats.focalPoint.x}% ${formats.focalPoint.y}%`
              : "50% 50%", // Ensure objectPosition is directly set
          }}
        />
      )}
    </div>
  )
}

/**
 * Generates CSS object-position style based on focal point coordinates
 */
function getFocalPointStyle(focalPoint) {
  if (
    !focalPoint ||
    typeof focalPoint.x !== "number" ||
    typeof focalPoint.y !== "number"
  ) {
    console.log("No valid focal point data, using default styles")
    return {
      objectFit: "cover",
      objectPosition: "50% 50%",
    }
  }

  // Log that we're applying focal point
  console.log(`Applying focal point: x=${focalPoint.x}%, y=${focalPoint.y}%`)

  // Convert focal point percentages to CSS object-position
  // This ensures the focal point stays visible during cropping
  return {
    objectFit: "cover",
    objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
  }
}

export default Image
