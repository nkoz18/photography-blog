import React, { useEffect } from "react";
import { getStrapiImageUrl } from "../lib/media";
import Image from "./image";

const Gallery = ({ images }) => {
  // Fix: Move useEffect outside the conditional return to follow React Hooks rules
  useEffect(() => {
    // Add CSS rule to hide captions
    const style = document.createElement('style');
    style.innerHTML = '.uk-lightbox-caption { display: none !important; }';
    document.head.appendChild(style);
    
    return () => {
      // Clean up function to remove style when component unmounts
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Return early after the hook declaration
  if (!images?.data) return null;

  const gallery = images.data.map((image, index) => {
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
        className="uk-grid uk-child-width-1-3@m uk-child-width-1-2@s uk-child-width-1-1@xs"
        uk-grid="masonry: true"
        uk-lightbox="animation: fade"
        suppressHydrationWarning // Add this to suppress hydration warning about classnames
      >
        {gallery}
      </div>
    </div>
  );
};

export default Gallery;