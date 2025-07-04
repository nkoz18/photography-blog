import React from "react"
import Card from "./card"

const Articles = ({ articles }) => {
  // Improved distribution logic for more balanced columns
  const leftArticlesCount = Math.ceil(articles.length / 2)
  const leftArticles = articles.slice(0, leftArticlesCount)
  const rightArticles = articles.slice(leftArticlesCount, articles.length)

  return (
    <div>
      <div className="uk-child-width-1-2@s uk-grid" data-uk-grid="">
        <div>
          {leftArticles.map((article, i) => {
            return (
              <Card
                article={article}
                key={`article__left__${article.attributes.slug}`}
              />
            )
          })}
        </div>
        <div>
          <div
            className="uk-child-width-1-1@m uk-grid-match uk-grid"
            data-uk-grid=""
          >
            {rightArticles.map((article, i) => {
              return (
                <Card
                  article={article}
                  key={`article__right__${article.attributes.slug}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Articles
