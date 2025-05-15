/**
 * Utility functions for selecting random assets
 */

// Array of available divider SVGs for random selection
const dividers = [
  "/images/dividers/1.svg",
  "/images/dividers/2.svg",
  "/images/dividers/3.svg",
  "/images/dividers/4.svg",
]

// Array of available menu icons for random selection
const menuIcons = [
  "/images/icons/cone.svg",
  "/images/icons/fries.svg",
  "/images/icons/hamburger.svg",
  "/images/icons/poison.svg",
  "/images/icons/syringe.svg",
  "/images/icons/zippo.svg",
]

/**
 * Return a random divider SVG path
 * @returns {string} Path to a random divider SVG
 */
export const getRandomDivider = () => {
  // Get a random index within the dividers array
  const randomIndex = Math.floor(Math.random() * dividers.length)
  return dividers[randomIndex]
}

/**
 * Return a random menu icon SVG path
 * @returns {string} Path to a random menu icon SVG
 */
export const getRandomMenuIcon = () => {
  // Get a random index within the menuIcons array
  const randomIndex = Math.floor(Math.random() * menuIcons.length)
  return menuIcons[randomIndex]
}

// Use a consistent menu icon to prevent hydration mismatch
// Using the first icon in the array to ensure consistency
const CACHED_MENU_ICON = "/images/icons/hamburger.svg"

/**
 * Return the cached menu icon to ensure consistency across page navigation
 * @returns {string} Path to the cached menu icon SVG
 */
export const getCachedMenuIcon = () => CACHED_MENU_ICON
