import React from "react"
import Link from "next/link"
import Image from "./image"

const Card = ({ article, className }) => {
  const imageUrl = article.attributes.image?.data
    ? article.attributes.image.data
    : null

  // Added defensive check for categories
  const category = article.attributes.category?.data
    ? article.attributes.category.data
    : article.attributes.categories?.data?.length
    ? article.attributes.categories.data[0]
    : null

  return (
    <div className={`article-item ${className || ""}`}>
      <Link href={`/article/${article.attributes.slug}`}>
        <a className="uk-link-reset">
          <div className="article-image">
            {imageUrl && (
              <Image
                image={article.attributes.image}
                alt={article.attributes.title || "Article image"}
              />
            )}
          </div>

          <div className="article-content">
            <h3 id="title">{article.attributes.title}</h3>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default Card
