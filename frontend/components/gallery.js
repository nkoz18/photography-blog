import React from "react"
import { getStrapiImageUrl } from "../lib/media"

const Gallery = ({ images }) => {
  if (!images.data) return null
  let gallery = images.data.map((image, index) => {
    return (
      <a
        className="uk-inline"
        href={getStrapiImageUrl(image)}
        data-caption={image.attributes.caption}
        key={index}
      >
        <picture>
          <source srcSet={getStrapiImageUrl(image)} type="image/webp" />
          <img
            src={getStrapiImageUrl(image)}
            width="1800"
            height="1200"
            alt={image.attributes.caption}
          />
        </picture>
      </a>
    )
  })

  return (
    <div
      uk-grid="masonry: true"
      className=".uk-child-width-expand uk-child-width-1-3@m"
      uk-lightbox="animation: fade"
    >
      {gallery}
    </div>
  )
}

export default Gallery
