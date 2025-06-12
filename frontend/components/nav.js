import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useDarkMode } from "../lib/useDarkMode"
import { getRandomMenuIcon } from "../lib/randomAssets"
import HoverDoodle from "./HoverDoodle"
import ScribbleToggle from "./ScribbleToggle"

const Nav = ({ categories, isMenuOpen, toggleMenu }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [menuIconSrc, setMenuIconSrc] = useState("/images/icons/hamburger.svg") // Default fallback
  const [mounted, setMounted] = useState(false)

  // Set a random menu icon on component mount
  useEffect(() => {
    setMenuIconSrc(getRandomMenuIcon())
    setMounted(true)
  }, [])

  // Path to the close icon
  const closeIconSrc = "/images/icons/x.svg"

  return (
    <div className="uk-container-large uk-align-center">
      <nav className={`uk-navbar-container uk-navbar nav-container ${isMenuOpen ? "menu-open" : ""}`}>
        <div className="uk-navbar-left">
          <ul className="uk-navbar-nav">
            <li>
              <Link href="/">
                <a className="site-logo">
                  <span className="logo-silky">silky</span>
                  <span className="logo-truth">truth</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>

        {/* Custom icon menu button for mobile */}
        <div className="hamburger-menu-container">
          <button
            className={`hamburger-menu-button ${isMenuOpen ? "is-active" : ""}`}
            onClick={() => toggleMenu(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <img src={menuIconSrc} alt="Menu" className="menu-icon" />
            <img
              src={closeIconSrc}
              alt="Close Menu"
              className="menu-icon-close"
            />
          </button>
        </div>

        {/* Navigation links - shown horizontally on desktop, hidden behind hamburger on mobile */}
        <div
          className={`uk-navbar-right nav-links ${isMenuOpen ? "is-open" : ""}`}
        >
          
          <ul className="uk-navbar-nav">
            {categories?.length > 0 &&
              categories.map((category) => (
                <li key={category.id}>
                  <HoverDoodle className="desktop-only">
                    <Link href={`/category/${category.attributes.slug}`}>
                      <a className="nav-link" onClick={() => toggleMenu(false)}>
                        {category.attributes.name}
                      </a>
                    </Link>
                  </HoverDoodle>
                </li>
              ))}
            <li>
              <ScribbleToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  )
}

export default Nav
