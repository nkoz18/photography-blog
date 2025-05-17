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

  // Use relative URLs if they start with /uploads
  if (url.startsWith("/uploads")) {
    return url
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

  // Use relative URLs if they start with /uploads
  if (url.startsWith("/uploads")) {
    return url
  }

  const imageUrl = url.startsWith("/") ? getStrapiURL(url) : url
  return imageUrl
}

export function getFocalPointImageUrl(image, width, height) {
  if (!image || !image.attributes) return null

  const { url, formats, provider_metadata } = image.attributes

  if (!url) {
    console.warn("No URL found in image data for focal point")
    return null
  }

  // Use relative URLs if they start with /uploads
  const baseUrl = url.startsWith("/uploads")
    ? url
    : url.startsWith("/")
    ? getStrapiURL(url)
    : url

  // Check multiple locations for focal point data
  let focalPoint = null

  // First check formats
  if (formats && formats.focalPoint) {
    focalPoint = formats.focalPoint
  }
  // Then check provider_metadata
  else if (provider_metadata && provider_metadata.focalPoint) {
    focalPoint = provider_metadata.focalPoint
  }
  // Last check for direct focalPoint property
  else if (image.attributes.focalPoint) {
    focalPoint = image.attributes.focalPoint
  }

  // If no focal point found, return regular image URL
  if (!focalPoint) {
    console.log("No focal point found, returning regular URL")
    return baseUrl
  }

  // Log found focal point
  console.log("Applied focal point to URL:", focalPoint)

  // Extract focal point coordinates
  const { x, y } = focalPoint

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
