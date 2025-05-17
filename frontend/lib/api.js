import qs from "qs"

/**
 * Get full Strapi URL from path
 * @param {string} path Path of the URL
 * @returns {string} Full Strapi URL
 */
export function getStrapiURL(path = "") {
  // Use environment variable for the base URL, with a fallback
  const baseURL =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://34.220.121.179:1337"

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

  // Always use the full API URL, especially for static export
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://34.220.121.179:1337"

  // Make sure path starts with /api
  const apiPath = path.startsWith("/api") ? path : `/api${path}`

  // Construct full request URL
  const requestUrl = `${apiBaseUrl}${apiPath}${
    queryString ? `?${queryString}` : ""
  }`

  // Log the API request in development for debugging
  if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
    console.log(`Fetching API: ${requestUrl}`)
  }

  try {
    // Fetch data from Strapi
    const response = await fetch(requestUrl, mergedOptions)

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching from ${requestUrl}:`, error)
    throw error
  }
}
