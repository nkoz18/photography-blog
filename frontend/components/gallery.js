import React, { useEffect } from "react";
import { getStrapiImageUrl } from "../lib/media";
import Image from "./image";

const Gallery = ({ images }) => {
  if (!images?.data) return null;

  // Add script to remove the caption div from lightbox
  useEffect(() => {
    // Add CSS rule to hide captions
    const style = document.createElement('style');
    style.innerHTML = '.uk-lightbox-caption { display: none !important; }';
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  let gallery = images.data.map((image, index) => {
    return (
      <div key={index} className="gallery-item-wrapper">
        <div className="gallery-item">
          <a
            className="uk-inline"
            href={getStrapiImageUrl(image)}
            data-caption="" // Empty caption to prevent showing filename
          >
            <Image image={{ data: image }} />
          </a>
        </div>
      </div>
    );
  });

  return (
    <div className="uk-margin-large-top">
      <hr className="uk-divider-icon" />
      <div
        uk-grid="masonry: true"
        className="uk-grid uk-child-width-1-3@m uk-child-width-1-2@s uk-child-width-1-1@xs"
        uk-lightbox="animation: fade"
      >
        {gallery}
      </div>
    </div>
  );
};

export default Gallery;