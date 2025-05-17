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

  // For client-side, make sure we include the full URL to the backend
  const isClient = typeof window !== "undefined"
  const backendUrl =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "https://api.silkytruth.com"

  // For absolute URLs, return directly
  if (url.startsWith("http")) {
    return url
  }

  // For uploads paths, prepend the backend URL
  if (url.startsWith("/uploads")) {
    return `${backendUrl}${url}`
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

  // For client-side, make sure we include the full URL to the backend
  const backendUrl =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "https://api.silkytruth.com"

  // For absolute URLs, return directly
  if (url.startsWith("http")) {
    return url
  }

  // For uploads paths, prepend the backend URL
  if (url.startsWith("/uploads")) {
    return `${backendUrl}${url}`
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

  // For client-side, make sure we include the full URL to the backend
  const backendUrl =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "https://api.silkytruth.com"

  // Process URL to get base URL
  let baseUrl = ""

  // For absolute URLs, return directly
  if (url.startsWith("http")) {
    baseUrl = url
  }
  // For uploads paths, prepend the backend URL
  else if (url.startsWith("/uploads")) {
    baseUrl = `${backendUrl}${url}`
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
