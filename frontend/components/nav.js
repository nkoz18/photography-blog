import React from "react"
import Link from "next/link"

const Nav = ({ categories }) => {
  return (
    <div className="uk-container-large uk-align-center">
      <nav className="uk-navbar-container uk-navbar">
        <div className="uk-navbar-left">
          <ul className="uk-navbar-nav">
            <li>
              <Link href="/">
                <a>silky truth</a>
              </Link>
            </li>
          </ul>
        </div>
        <div className="uk-navbar-right">
          <ul className="uk-navbar-nav">
            {categories?.length > 0 &&
              categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.attributes.slug}`}>
                    {category.attributes.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </nav>
    </div>
  )
}

export default Nav
