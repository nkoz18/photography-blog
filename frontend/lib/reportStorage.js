/**
 * Session storage utility for tracking reported images
 * Prevents users from reporting the same image multiple times in a session
 */

const STORAGE_KEY = 'silkytruth_reported_images'

/**
 * Get all reported image IDs from session storage
 * @returns {Set<string>} Set of reported image IDs
 */
export const getReportedImages = () => {
  if (typeof window === 'undefined') return new Set()
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch (error) {
    console.warn('Failed to read reported images from session storage:', error)
    return new Set()
  }
}

/**
 * Check if an image has been reported in this session
 * @param {string|number} imageId - The image ID to check
 * @returns {boolean} True if image has been reported
 */
export const isImageReported = (imageId) => {
  const reportedImages = getReportedImages()
  const stringId = String(imageId)
  const hasReported = reportedImages.has(stringId)
  
  // Debug logging
  console.log('📝 Session Storage Check:', {
    imageId,
    stringId,
    hasReported,
    allReportedIds: Array.from(reportedImages)
  })
  
  return hasReported
}

/**
 * Mark an image as reported in this session
 * @param {string|number} imageId - The image ID to mark as reported
 */
export const markImageAsReported = (imageId) => {
  if (typeof window === 'undefined') return
  
  try {
    const reportedImages = getReportedImages()
    const stringId = String(imageId)
    reportedImages.add(stringId)
    const updatedArray = Array.from(reportedImages)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArray))
    
    // Debug logging
    console.log('✅ Marked as reported:', {
      imageId,
      stringId,
      updatedReportedIds: updatedArray
    })
  } catch (error) {
    console.warn('Failed to save reported image to session storage:', error)
  }
}

/**
 * Clear all reported images from session storage
 * Useful for testing or manual cleanup
 */
export const clearReportedImages = () => {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear reported images from session storage:', error)
  }
}

/**
 * Get count of reported images in this session
 * @returns {number} Number of images reported
 */
export const getReportedImagesCount = () => {
  return getReportedImages().size
}