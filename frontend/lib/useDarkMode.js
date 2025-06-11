import { useEffect, useState } from "react"

/**
 * Custom hook for managing dark mode
 * - Uses system preference as initial value
 * - Persists user preference in localStorage
 * - Adds/removes 'dark-mode' class on html and body
 * - Supports toggling between modes
 * - Prevents flash by checking existing class state
 */
export const useDarkMode = () => {
  // Initialize dark mode based on existing class (set by head script) or preferences
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if dark mode class is already applied (by head script)
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark-mode')
    }
    return false
  })

  // Effect to initialize dark mode state on client-side
  useEffect(() => {
    // Check if dark mode was already applied by head script
    const hasExistingDarkMode = document.documentElement.classList.contains('dark-mode')
    
    if (hasExistingDarkMode) {
      // Dark mode already applied, just sync state
      setIsDarkMode(true)
      return
    }

    // If not applied, check preferences
    const getInitialDarkMode = () => {
      // Check localStorage first
      const savedMode = localStorage.getItem("darkMode")
      if (savedMode !== null) {
        return savedMode === "true"
      }

      // Then check system preference
      if (window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
      }

      return false
    }

    setIsDarkMode(getInitialDarkMode())
  }, [])

  // Effect to add/remove dark mode class and update localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode")
      document.body.classList.add("dark-mode")
    } else {
      document.documentElement.classList.remove("dark-mode")
      document.body.classList.remove("dark-mode")
    }

    // Save to localStorage
    localStorage.setItem("darkMode", isDarkMode.toString())

    // Update CSS variables for dark mode (updated colors)
    applyColorScheme(isDarkMode)
  }, [isDarkMode])

  // Effect to listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (localStorage.getItem("darkMode") === null) {
        setIsDarkMode(e.matches)
      }
    }

    // Add listener for system preference changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange)
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  // Helper function to apply CSS variables based on dark/light mode
  const applyColorScheme = (isDark) => {
    const root = document.documentElement

    if (isDark) {
      root.style.setProperty("--color-background", "#1a1a1a")
      root.style.setProperty("--color-text", "#efefef")
      root.style.setProperty("--color-primary", "#ff007f")
      root.style.setProperty("--color-secondary", "#ff007f")
      root.style.setProperty("--color-accent", "#d0d0d0")
      root.style.setProperty("--color-border", "#444444")
      root.style.setProperty("--image-grayscale", "10%")
      root.style.setProperty("--image-opacity", "90%")
      root.style.setProperty("--navbar-bg", "#1a1a1a")
      root.style.setProperty("--card-bg", "#1a1a1a")
      root.style.setProperty("--footer-bg", "#1a1a1a")
    } else {
      root.style.setProperty("--color-background", "#ffffff")
      root.style.setProperty("--color-text", "#333333")
      root.style.setProperty("--color-primary", "#ff007f")
      root.style.setProperty("--color-secondary", "#ff007f")
      root.style.setProperty("--color-accent", "#444444")
      root.style.setProperty("--color-border", "#dddddd")
      root.style.setProperty("--image-grayscale", "0%")
      root.style.setProperty("--image-opacity", "100%")
      root.style.setProperty("--navbar-bg", "#ffffff")
      root.style.setProperty("--card-bg", "#ffffff")
      root.style.setProperty("--footer-bg", "#ffffff")
    }
  }

  // Toggle function
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode)
  }

  return { isDarkMode, toggleDarkMode }
}
