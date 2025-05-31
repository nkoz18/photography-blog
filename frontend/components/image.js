import { useState, useEffect } from "react"
import { getStrapiMedia, getFocalPointImageUrl } from "../lib/media"

/**
 * Improved image component that handles focal points for better cropping
 */
const Image = ({ image, style, alt }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [imgSrc, setImgSrc] = useState("")
  const [hasError, setHasError] = useState(false)

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
      // For now, always use regular media URL to avoid focal point URL issues
      // TODO: Re-enable focal point URLs once backend supports them properly
      const src = getStrapiMedia(image)
      setImgSrc(src)
    }
  }, [image])

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
        // Set focal point as a CSS variable that can be used by our CSS
        ...(focalPoint && {
          "--focal-point": `${focalPoint.x}% ${focalPoint.y}%`,
        }),
      }}
    >
      {isLoading && <div className="image-loader">Loading...</div>}
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
          onError={(e) => {
            console.error("Image failed to load:", imgSrc, e)
            setIsLoading(false)
            setHasError(true)
            // Try to reload with a simpler URL without focal point params
            if (imgSrc.includes('fp-x=')) {
              const simpleUrl = getStrapiMedia(image)
              if (simpleUrl !== imgSrc) {
                console.log("Retrying with simple URL:", simpleUrl)
                setImgSrc(simpleUrl)
                setHasError(false)
                setIsLoading(true)
              }
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
