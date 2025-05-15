import Head from "next/head"
import { useContext } from "react"
import { GlobalContext } from "../pages/_app"
import { getStrapiMedia } from "../lib/media"

const Seo = ({ seo = {} }) => {
  const { defaultSeo = {}, siteName = "Photography Blog" } =
    useContext(GlobalContext)
  const seoWithDefaults = {
    ...defaultSeo,
    ...seo,
  }

  // Set sensible defaults for missing values
  const metaTitle = seoWithDefaults.metaTitle || "Photography Blog"
  const metaDescription =
    seoWithDefaults.metaDescription || "A beautiful photography blog"

  // Try to get the image URL, handling the case where it might be missing
  let shareImage = null
  try {
    if (seoWithDefaults.shareImage) {
      shareImage = getStrapiMedia(seoWithDefaults.shareImage)
    }
  } catch (err) {
    console.warn("Error getting share image:", err.message)
  }

  const fullSeo = {
    metaTitle: `${metaTitle}${siteName ? ` | ${siteName}` : ""}`,
    metaDescription,
    shareImage,
    article: seoWithDefaults.article || false,
  }

  return (
    <Head>
      {fullSeo.metaTitle && (
        <>
          <title>{fullSeo.metaTitle}</title>
          <meta property="og:title" content={fullSeo.metaTitle} />
          <meta name="twitter:title" content={fullSeo.metaTitle} />
        </>
      )}
      {fullSeo.metaDescription && (
        <>
          <meta name="description" content={fullSeo.metaDescription} />
          <meta property="og:description" content={fullSeo.metaDescription} />
          <meta name="twitter:description" content={fullSeo.metaDescription} />
        </>
      )}
      {fullSeo.shareImage && (
        <>
          <meta property="og:image" content={fullSeo.shareImage} />
          <meta name="twitter:image" content={fullSeo.shareImage} />
          <meta name="image" content={fullSeo.shareImage} />
        </>
      )}
      {fullSeo.article && <meta property="og:type" content="article" />}
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  )
}

export default Seo
