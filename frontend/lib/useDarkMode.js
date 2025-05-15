import { useEffect, useState } from "react"

/**
 * Custom hook for managing dark mode
 * - Uses system preference as initial value
 * - Persists user preference in localStorage
 * - Adds/removes 'dark-mode' class on body
 * - Supports toggling between modes
 */
export const useDarkMode = () => {
  // Initialize dark mode based on system preference and saved preference
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Effect to initialize dark mode state
  useEffect(() => {
    // Helper to get initial dark mode preference
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

      // Default to false
      return false
    }

    setIsDarkMode(getInitialDarkMode())
  }, [])

  // Effect to add/remove dark mode class and update localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
    }

    // Save to localStorage
    localStorage.setItem("darkMode", isDarkMode.toString())

    // Update CSS variables for dark mode
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
      root.style.setProperty("--color-background", "#1f2023")
      root.style.setProperty("--color-text", "#efefef")
      root.style.setProperty("--color-primary", "#6a9fb5")
      root.style.setProperty("--color-secondary", "#ac885b")
      root.style.setProperty("--color-accent", "#d0d0d0")
      root.style.setProperty("--color-border", "#444444")
      root.style.setProperty("--image-grayscale", "10%")
      root.style.setProperty("--image-opacity", "90%")
    } else {
      root.style.setProperty("--color-background", "#ffffff")
      root.style.setProperty("--color-text", "#333333")
      root.style.setProperty("--color-primary", "#1e88e5")
      root.style.setProperty("--color-secondary", "#e65100")
      root.style.setProperty("--color-accent", "#444444")
      root.style.setProperty("--color-border", "#dddddd")
      root.style.setProperty("--image-grayscale", "0%")
      root.style.setProperty("--image-opacity", "100%")
    }
  }

  // Toggle function
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode)
  }

  return { isDarkMode, toggleDarkMode }
}
