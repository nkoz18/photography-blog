import qs from "qs"

/**
 * Get full Strapi URL from path
 * @param {string} path Path of the URL
 * @returns {string} Full Strapi URL
 */
export function getStrapiURL(path = "") {
  // Use environment variable for the base URL, with a fallback
  const baseURL =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://127.0.0.1:1337"

  // Make sure path starts with a slash if it's not empty
  const normalizedPath = path && !path.startsWith("/") ? `/${path}` : path

  // If baseURL is already a relative path (like "/api"), we need to handle differently
  if (baseURL.startsWith("/")) {
    // For relative base URLs, we need to make sure we don't double the slashes
    if (normalizedPath.startsWith("/")) {
      return `${baseURL}${normalizedPath.substring(1)}`
    }
    return `${baseURL}/${normalizedPath}`
  }

  // Regular case for absolute URLs
  return `${baseURL}${normalizedPath}`
}

/**
 * Helper to make GET requests to Strapi API endpoints
 * @param {string} path Path of the API route
 * @param {Object} urlParamsObject URL params object, will be stringified
 * @param {Object} options Options passed to fetch
 * @returns Parsed API call response
 */
export async function fetchAPI(path, urlParamsObject = {}, options = {}) {
  // Merge default and user options
  const mergedOptions = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  }

  // Build request URL
  const queryString = qs.stringify(urlParamsObject)

  // When using relative API paths, we need to handle the path construction differently
  let requestUrl = ""
  if (process.env.NEXT_PUBLIC_STRAPI_API_URL.startsWith("/")) {
    // For relative API paths, the /api prefix is handled by Next.js rewrites
    requestUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${path}${
      queryString ? `?${queryString}` : ""
    }`
  } else {
    // For absolute API URLs (like in dev mode)
    requestUrl = `${getStrapiURL(
      `/api${path}${queryString ? `?${queryString}` : ""}`
    )}`
  }

  // Trigger API call
  try {
    const response = await fetch(requestUrl, mergedOptions)

    // Handle response
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`)
      throw new Error(`An error occurred, please try again`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API fetch error:", error)
    throw error
  }
}
