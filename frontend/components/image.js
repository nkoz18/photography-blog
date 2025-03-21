import { useState, useEffect } from "react";
import { getStrapiMedia } from "../lib/media";

/**
 * Improved image component that handles initial loads better
 * Created by Nikita Kozlov to fix image loading issues
 */
const Image = ({ image, style }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState("");
  
  useEffect(() => {
    // Only set the image source after component mounts
    // This ensures proper hydration in Next.js
    if (image?.data?.attributes) {
      const src = getStrapiMedia(image);
      setImgSrc(src);
    }
  }, [image]);
  
  if (!image?.data?.attributes) {
    return null; // Don't render anything if no image is available
  }

  const { alternativeText } = image.data.attributes;

  return (
    <div className="image-container">
      {isLoading && <div className="image-loader"></div>}
      {imgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={alternativeText || ""}
          className={`image-transition ${isLoading ? "image-loading" : "image-loaded"}`}
          onLoad={() => setIsLoading(false)}
          style={{ width: "100%", height: "auto", ...style }}
        />
      )}
    </div>
  );
};

export default Image;