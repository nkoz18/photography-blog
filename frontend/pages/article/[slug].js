import ReactMarkdown from "react-markdown"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import Image from "../../components/image"
import Seo from "../../components/seo"
import dynamic from "next/dynamic"
import { getStrapiMedia } from "../../lib/media"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

// Import PhotoSwipeGallery with dynamic import to avoid SSR issues
const PhotoSwipeGallery = dynamic(
  () => import("../../components/PhotoSwipeGallery"),
  {
    ssr: false,
  }
)


const Article = ({ article: staticArticle, categories }) => {
  const router = useRouter()
  const [article, setArticle] = useState(staticArticle)
  const [loading, setLoading] = useState(false)
  
  if (!staticArticle) {
    return { notFound: true } // 404 if article is missing
  }

  // Debug log to check the exact structure of gallery and images
  useEffect(() => {
    console.log("Article data structure:", article)
    if (article.attributes.gallery) {
      console.log("Article gallery:", article.attributes.gallery)
    }
    if (article.attributes.images) {
      console.log("Article images:", article.attributes.images)
    }

    // Log complete image data for debugging
    console.log(
      "Complete image data:",
      article.attributes.image?.data?.attributes
    )

    // Log provider_metadata specifically if exists
    if (article.attributes.image?.data?.attributes?.provider_metadata) {
      console.log(
        "Provider metadata:",
        article.attributes.image.data.attributes.provider_metadata
      )
    }

    // Log focal point data if available from any source
    const imageData = article.attributes.image?.data?.attributes
    let focalPoint = null

    // Check in formats
    if (imageData?.formats?.focalPoint) {
      focalPoint = imageData.formats.focalPoint
      console.log("Found focal point in formats:", focalPoint)
    }
    // Check in provider_metadata
    else if (imageData?.provider_metadata?.focalPoint) {
      focalPoint = imageData.provider_metadata.focalPoint
      console.log("Found focal point in provider_metadata:", focalPoint)

      // Add to formats for consistency
      if (!imageData.formats) {
        imageData.formats = {}
      }
      imageData.formats.focalPoint = focalPoint
    }
    // Check direct property
    else if (imageData?.focalPoint) {
      focalPoint = imageData.focalPoint
      console.log("Found focal point as direct property:", focalPoint)
    }

    if (focalPoint) {
      console.log("Focal point data:", focalPoint)
      console.log(
        "Image will use focal point positioning at:",
        `${focalPoint.x}% ${focalPoint.y}%`
      )
    } else {
      console.log("No focal point data found for the featured image")
    }
  }, [article])

  // Always fetch fresh data from CMS on page load to show latest content
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!router.query.slug) return
      
      setLoading(true)
      try {
        let articlesRes
        
        // Check if slug contains a token (format: slug~token)
        const slugParam = router.query.slug
        const hasToken = slugParam.includes('~')
        
        if (hasToken) {
          // Split slug and token
          const [articleSlug, token] = slugParam.split('~')
          
          // Use the tokenized article endpoint
          const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'https://api.silkytruth.com'}/api/articles/by-token/${articleSlug}/${token}`)
          
          if (response.ok) {
            const articleData = await response.json()
            // Convert to the same format as the regular API response
            articlesRes = { data: [{ id: articleData.id, attributes: articleData }] }
          } else {
            throw new Error('Article not found or invalid token')
          }
        } else {
          // Regular published article fetch
          articlesRes = await fetchAPI("/articles", {
            filters: {
              slug: slugParam,
              publishedAt: {
                $notNull: true,
              },
            },
            populate: {
              image: {
                fields: [
                  "url",
                  "alternativeText", 
                  "caption",
                  "width",
                  "height",
                  "formats",
                  "provider_metadata",
                ],
              },
              images: {
                fields: [
                  "url",
                  "alternativeText",
                  "caption", 
                  "width",
                  "height",
                  "formats",
                  "provider_metadata",
                ],
              },
              gallery: {
                populate: {
                  gallery_items: {
                    populate: {
                      image: {
                        fields: [
                          "url",
                          "alternativeText",
                          "caption",
                          "width",
                          "height", 
                          "formats",
                          "provider_metadata",
                        ],
                      },
                    },
                  },
                },
              },
              author: { populate: { picture: { fields: ["url"] } } },
              categories: { fields: ["name", "slug"] },
            },
          })
        }
        
        if (articlesRes.data && articlesRes.data.length > 0) {
          console.log("Fetched fresh article data:", articlesRes.data[0])
          setArticle(articlesRes.data[0])
        }
      } catch (error) {
        console.error("Error fetching fresh article data:", error)
        // Keep static article data as fallback
      } finally {
        setLoading(false)
      }
    }
    
    fetchFreshData()
  }, [router.query.slug])

  // Check if this is a tokenized URL or unpublished article
  const isTokenizedUrl = router.query.slug && router.query.slug.includes('~')
  const isUnpublished = !article.attributes.publishedAt
  
  const seo = {
    metaTitle: article.attributes.title,
    metaDescription: article.attributes.description,
    shareImage: article.attributes.image,
    article: true,
    // Add noindex for tokenized URLs or unpublished articles
    noindex: isTokenizedUrl || isUnpublished,
  }

  return (
    <Layout categories={categories}>
      <Seo seo={seo} />
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          {/* Cover Image - Content Width */}
          {article.attributes.image && (
            <div
              className="article-cover-image"
              style={{
                marginBottom: "2rem",
                maxWidth: "100%",
                overflow: "hidden",
                // Ensure minimum height to show focal point effect
                minHeight: "300px",
              }}
            >
              <Image
                image={article.attributes.image}
                alt={article.attributes.title || "Article featured image"}
              />
            </div>
          )}

          {/* Article Title and Content */}
          <h1 className="uk-article-title">{article.attributes.title}</h1>
          {article.attributes.author?.data?.attributes && (
            <p className="article-author">
              by {article.attributes.author.data.attributes.name}
            </p>
          )}
          <div className="uk-article-content">
            <ReactMarkdown
              source={article.attributes.content}
              escapeHtml={false}
            />
          </div>

          {/* PhotoSwipe Gallery - Uses either new gallery component or legacy images */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading latest gallery content...</p>
            </div>
          ) : (
            <PhotoSwipeGallery
              galleryData={article.attributes.gallery}
              images={article.attributes.images}
            />
          )}
        </div>
      </div>

    </Layout>
  )
}

export async function getStaticPaths() {
  // Return empty paths with fallback: 'blocking' to render on demand
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const [articlesRes, categoriesRes] = await Promise.all([
    fetchAPI("/articles", {
      filters: { 
        slug: params.slug,
        publishedAt: {
          $notNull: true,
        },
      },
      populate: {
        image: {
          fields: [
            "url",
            "alternativeText",
            "caption",
            "width",
            "height",
            "formats",
            "provider_metadata",
          ],
        },
        images: {
          fields: [
            "url",
            "alternativeText",
            "caption",
            "width",
            "height",
            "formats",
            "provider_metadata",
          ],
        },
        gallery: {
          populate: {
            images: {
              fields: [
                "url",
                "alternativeText",
                "caption",
                "width",
                "height",
                "formats",
                "provider_metadata",
              ],
            },
            gallery_items: {
              populate: {
                image: {
                  fields: [
                    "url",
                    "alternativeText",
                    "caption",
                    "width",
                    "height",
                    "formats",
                    "provider_metadata",
                  ],
                },
              },
            },
          },
        },
        author: { populate: { picture: { fields: ["url"] } } },
        categories: { fields: ["name", "slug"] },
      },
    }),
    fetchAPI("/categories", { fields: ["name", "slug"] }),
  ])

  if (!articlesRes.data.length) {
    return { notFound: true }
  }

  return {
    props: { 
      article: articlesRes.data[0], 
      categories: categoriesRes.data,
    },
    // No revalidate needed with static export + client-side fetching
  }
}

export default Article
