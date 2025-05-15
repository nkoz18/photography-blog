import { getStrapiURL } from "./api"

export function getStrapiMedia(media) {
  if (!media || !media.data || !media.data.attributes) {
    console.warn("Invalid media data provided to getStrapiMedia")
    return null
  }

  const { url } = media.data.attributes
  if (!url) {
    console.warn("No URL found in media data")
    return null
  }

  const imageUrl = url.startsWith("/") ? getStrapiURL(url) : url
  return imageUrl
}

export function getStrapiImageUrl(image) {
  if (!image || !image.attributes) {
    console.warn("Invalid image data provided to getStrapiImageUrl")
    return null
  }

  const { url } = image.attributes
  if (!url) {
    console.warn("No URL found in image data")
    return null
  }

  const imageUrl = url.startsWith("/") ? getStrapiURL(url) : url
  return imageUrl
}

export function getFocalPointImageUrl(image, width, height) {
  if (!image || !image.attributes) return null

  const { url, formats } = image.attributes

  if (!url) {
    console.warn("No URL found in image data for focal point")
    return null
  }

  const baseUrl = url.startsWith("/") ? getStrapiURL(url) : url

  // If no formats or focal point, return regular image URL
  if (!formats || !formats.focalPoint) {
    return baseUrl
  }

  // Extract focal point coordinates
  const { x, y } = formats.focalPoint

  // Add focal point parameters to URL
  // Format depends on your image provider/CDN
  // This example is generic and may need adaptation
  const focalPointParam = `fp-x=${x / 100}&fp-y=${y / 100}`
  const sizeParam = width && height ? `&width=${width}&height=${height}` : ""

  // If URL already has query parameters
  if (baseUrl.includes("?")) {
    return `${baseUrl}&${focalPointParam}${sizeParam}`
  }

  return `${baseUrl}?${focalPointParam}${sizeParam}`
}
