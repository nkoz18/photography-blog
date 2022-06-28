import React from "react"
import { getStrapiImageUrl } from "../lib/media"

const Gallery = ({ images }) => {
  if (!images.data) return null
  let gallery = images.data.map((image, index) => {
    return (
      <a
        class="uk-inline"
        href={getStrapiImageUrl(image)}
        data-caption={image.attributes.caption}
        key={index}
      >
        <img src={getStrapiImageUrl(image)} width="1800" height="1200" alt="" />
      </a>
    )
  })

  return (
    <div
      uk-grid="masonry: true"
      class=".uk-child-width-expand uk-child-width-1-3@m"
      uk-lightbox="animation: fade"
    >
      {gallery}
    </div>
  )
}

export default Gallery
