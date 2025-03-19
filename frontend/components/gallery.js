import React from "react"
import { getStrapiImageUrl } from "../lib/media"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"
import Image from "./image"

const Gallery = ({ images }) => {
  if (!images.data) return null

  // Handle direct download of the image
  const handleDownload = (e, imageUrl, caption) => {
    e.preventDefault()
    e.stopPropagation()

    const filename = caption
      ? `${caption.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.jpg`
      : `image-${new Date().getTime()}.jpg`

    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.setAttribute("download", filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
      .catch((error) => console.error("Download error:", error))
  }

  let gallery = images.data.map((image, index) => {
    //image is images.data[index]

    const caption = image.attributes.caption || ""

    return (
      <div key={index}>
        <div className="uk-position-relative">
          <a
            className="uk-inline"
            href={getStrapiImageUrl(image)} // Use getStrapiImageUrl here for consistency
            data-caption={caption}
          >
            <picture>
              <source srcSet={getStrapiImageUrl(image)} type="image/webp" />
              <Image image={{ data: image }} />
            </picture>
          </a>
          <div className="gallery-item">
            <a
              className="uk-inline"
              href={getStrapiImageUrl(image)}
              data-caption={caption}
              style={{ position: "relative", display: "block" }} // Ensures correct positioning
            >
              <picture>
                <source srcSet={getStrapiImageUrl(image)} type="image/webp" />
                <Image image={image} />
              </picture>

              {/* Download button placed inside "uk-inline" so it overlaps the image */}
              <div className="download-button">
                <button
                  className="uk-icon-button uk-button-secondary"
                  onClick={(e) =>
                    handleDownload(e, getStrapiImageUrl(image), caption)
                  }
                >
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </div>
            </a>
          </div>
        </div>
      </div>
    )
  })

  return (
    <div className="uk-margin-large-top">
      <hr className="uk-divider-icon" />
      <div
        uk-grid="masonry: true"
        className="uk-grid uk-child-width-1-3@m uk-child-width-1-2@s"
        uk-lightbox="animation: fade"
      >
        {gallery}
      </div>
    </div>
  )
}

export default Gallery
