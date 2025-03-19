import React from "react"
import { getStrapiImageUrl } from "../lib/media"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faDownload } from "@fortawesome/free-solid-svg-icons"

const Gallery = ({ images }) => {
  if (!images.data) return null

  // Handle direct download of the image
  const handleDownload = (e, imageUrl, caption) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Create a filename from the caption or use a default
    const filename = caption ? 
      `${caption.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg` : 
      `image-${new Date().getTime()}.jpg`
    
    // Create an anchor element and trigger download
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  let gallery = images.data.map((image, index) => {
    const imageUrl = getStrapiImageUrl(image)
    const caption = image.attributes.caption || ""
    
    return (
      <div key={index}>
        <div className="uk-position-relative">
          <a
            className="uk-inline"
            href={imageUrl}
            data-caption={caption}
          >
            <picture>
              <source srcSet={imageUrl} type="image/webp" />
              <Image
                src={imageUrl}
                alt={caption}
                loading="lazy" 
                width="1800"
                height="1200"
              />
            </picture>
          </a>
          
          {/* Download button overlay */}
          <div 
            className="uk-position-top-right uk-margin-small-right uk-margin-small-top"
            style={{ zIndex: 10 }}
            onClick={(e) => handleDownload(e, imageUrl, caption)}
          >
            <button className="uk-icon-button uk-button-secondary">
              <FontAwesomeIcon icon={faDownload} />
            </button>
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