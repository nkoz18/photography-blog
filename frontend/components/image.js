import { getStrapiMedia } from "../lib/media"
import NextImage from "next/image"

const Image = ({ image, style }) => {
  if (!image || !image.data || !image.data.attributes) {
    return <div style={style}>No Image</div>;
  }

  const { url, alternativeText, width, height } = image.data.attributes;
  const imgWidth = width || 1000;
  const imgHeight = height || 1000;

  return (
    <NextImage
    layout="intrinsic" // Change from "responsive" to "intrinsic" for better behavior
    width={imgWidth}
    height={imgHeight}
    objectFit="contain"
    src={getStrapiMedia(image)}
    alt={alternativeText || ""}
    style={{ width: "100%", height: "auto" }} // Ensures image takes proper space
  />
  
  );
};

export default Image;