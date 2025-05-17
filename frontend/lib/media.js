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

  // For absolute URLs, convert to relative URL if it's from our backend server
  if (url.startsWith("http")) {
    // If URL is from our backend, convert to relative
    if (url.includes("34.220.121.179:1337")) {
      const relativePath = url.split("34.220.121.179:1337")[1]
      return relativePath // This will work with our rewrite rules
    }
    return url
  }

  // For uploads paths - use relative URLs directly
  if (url.startsWith("/uploads")) {
    return url // Use relative URL directly - will be handled by rewrites
  }

  // For other relative URLs
  const imageUrl = getStrapiURL(url)
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

  // For absolute URLs, convert to relative URL if it's from our backend server
  if (url.startsWith("http")) {
    // If URL is from our backend, convert to relative
    if (url.includes("34.220.121.179:1337")) {
      const relativePath = url.split("34.220.121.179:1337")[1]
      return relativePath // This will work with our rewrite rules
    }
    return url
  }

  // For uploads paths - use relative URLs directly
  if (url.startsWith("/uploads")) {
    return url // Use relative URL directly - will be handled by rewrites
  }

  // For other relative URLs
  const imageUrl = getStrapiURL(url)
  return imageUrl
}

export function getFocalPointImageUrl(image, width, height) {
  if (!image || !image.attributes) return null

  const { url, formats, provider_metadata } = image.attributes

  if (!url) {
    console.warn("No URL found in image data for focal point")
    return null
  }

  // Process URL to get base URL
  let baseUrl = ""

  // For absolute URLs, convert to relative if from our backend
  if (url.startsWith("http")) {
    // If URL is from our backend, convert to relative
    if (url.includes("34.220.121.179:1337")) {
      const relativePath = url.split("34.220.121.179:1337")[1]
      baseUrl = relativePath // This will work with our rewrite rules
    } else {
      baseUrl = url
    }
  }
  // For uploads paths - use relative URLs directly
  else if (url.startsWith("/uploads")) {
    baseUrl = url // Use relative URL directly - will be handled by rewrites
  }
  // For other relative URLs
  else {
    baseUrl = getStrapiURL(url)
  }

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
