import React, { useEffect, useState } from "react"
import Nav from "./nav"
import Footer from "./footer"

/**
 * Layout component with proper sticky footer
 * Uses a combination of CSS and inline styles to ensure the footer
 * stays at the bottom even with short content
 */
const Layout = ({ children, categories, seo }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Toggle menu state for mobile
  const toggleMenu = (isOpen) => {
    setIsMenuOpen(isOpen)

    // Add or remove menu-open class to body
    if (isOpen) {
      document.body.classList.add("menu-open")
    } else {
      document.body.classList.remove("menu-open")
    }
  }

  // Add styles directly to ensure we're affecting the right elements
  useEffect(() => {
    // Make sure the Next.js wrapper has full height
    if (document.getElementById("__next")) {
      document.getElementById("__next").style.minHeight = "100vh"
      document.getElementById("__next").style.display = "flex"
      document.getElementById("__next").style.flexDirection = "column"
    }

    // Add styles to html and body
    document.documentElement.style.height = "100%"
    document.body.style.minHeight = "100%"
    document.body.style.display = "flex"
    document.body.style.flexDirection = "column"
    document.body.style.margin = "0"

    // Close menu when Escape key is pressed
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        toggleMenu(false)
      }
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        toggleMenu(false)
      }
    }

    // Add event listeners
    window.addEventListener("keydown", handleEscKey)
    window.addEventListener("resize", handleResize)

    return () => {
      // Clean up styles when component unmounts
      if (document.getElementById("__next")) {
        document.getElementById("__next").style.minHeight = ""
        document.getElementById("__next").style.display = ""
        document.getElementById("__next").style.flexDirection = ""
      }

      document.documentElement.style.height = ""
      document.body.style.minHeight = ""
      document.body.style.display = ""
      document.body.style.flexDirection = ""
      document.body.style.margin = ""
      document.body.classList.remove("menu-open")

      // Clean up event listeners
      window.removeEventListener("keydown", handleEscKey)
      window.removeEventListener("resize", handleResize)
    }
  }, [isMenuOpen])

  return (
    <>
      <Nav
        categories={categories}
        isMenuOpen={isMenuOpen}
        toggleMenu={toggleMenu}
      />
      <div
        className="content-wrapper"
        onClick={() => isMenuOpen && toggleMenu(false)}
      >
        {children}
      </div>
      <Footer />
    </>
  )
}

export default Layout
