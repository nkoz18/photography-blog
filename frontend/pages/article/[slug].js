import ReactMarkdown from "react-markdown"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import Image from "../../components/image"
import Seo from "../../components/seo"
import dynamic from "next/dynamic"
import { getStrapiMedia } from "../../lib/media"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import UnlistedNotice from "../../components/UnlistedNotice"

// Import PhotoSwipeGallery with dynamic import to avoid SSR issues
const PhotoSwipeGallery = dynamic(
  () => import("../../components/PhotoSwipeGallery"),
  {
    ssr: false,
  }
)

const Article = ({ article: staticArticle, categories, global }) => {
  const router = useRouter()
  const [article, setArticle] = useState(staticArticle)
  const [loading, setLoading] = useState(false)
  
  // Debug log to check the exact structure of gallery and images
  useEffect(() => {
    if (!article?.attributes) return
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
  }, [article])

  // Always fetch fresh data from CMS on page load to show latest content
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!router.query.slug) return
      
      setLoading(true)
      try {
        // Regular published article fetch (always fetch fresh data)
        // Include bypassListedFilter to ensure unlisted articles can be fetched
        const articlesRes = await fetchAPI("/articles", {
          bypassListedFilter: true,
          filters: {
            slug: router.query.slug,
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
        })

        if (articlesRes.data.length > 0) {
          setArticle(articlesRes.data[0])
        } else {
          // Article not found
          router.replace('/404')
          return
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

  // Handle case where article doesn't exist
  if (!staticArticle && !article) {
    return <div>Loading...</div>
  }

  // Use current article data or fallback to static
  const currentArticle = article || staticArticle

  if (!currentArticle?.attributes) {
    return <div>Article not found</div>
  }

  const seo = {
    metaTitle: currentArticle.attributes.title,
    metaDescription: currentArticle.attributes.description,
    shareImage: currentArticle.attributes.image,
    article: true,
    // Add noindex for unlisted articles
    ...(currentArticle.attributes.listed === false && {
      metaRobots: "noindex, nofollow",
    }),
  }

  return (
    <Layout categories={categories || []}>
      <Seo seo={seo} global={global} />
      
      {/* Show unlisted notice for editors */}
      {currentArticle.attributes.listed === false && (
        <UnlistedNotice />
      )}
      
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          {currentArticle?.attributes ? (
            <>
              {/* Article Cover Image with Focal Point */}
              {currentArticle.attributes.image && (
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
                    image={currentArticle.attributes.image}
                    alt={currentArticle.attributes.title || "Article featured image"}
                  />
                </div>
              )}

              {/* Article Title and Content */}
              <h1 className="uk-article-title">{currentArticle.attributes.title}</h1>
              {currentArticle.attributes.author?.data?.attributes && (
                <p className="article-author">
                  by {currentArticle.attributes.author.data.attributes.name}
                </p>
              )}
              <div className="uk-article-content">
                <ReactMarkdown
                  source={currentArticle.attributes.content}
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
                  galleryData={currentArticle.attributes.gallery}
                  images={currentArticle.attributes.images}
                  articleSlug={router.query.slug || currentArticle.attributes.slug}
                />
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p>Loading article content...</p>
            </div>
          )}
        </div>
      </div>

    </Layout>
  )
}

export async function getStaticPaths() {
  try {
    // Generate paths for all published articles (listed and unlisted)
    const articlesRes = await fetchAPI("/articles", { 
      fields: ["slug"],
      bypassListedFilter: true,
      filters: {
        publishedAt: {
          $notNull: true,
        },
      },
    })

    return {
      paths: articlesRes.data.map((article) => ({
        params: {
          slug: article.attributes.slug,
        },
      })),
      fallback: false, // Must be false for static export
    }
  } catch (error) {
    console.error("Error in getStaticPaths:", error)
    return {
      paths: [],
      fallback: false,
    }
  }
}

export async function getStaticProps({ params }) {
  try {
    // Fetch any published article (listed or unlisted) for direct access
    const articlesRes = await fetchAPI("/articles", {
      bypassListedFilter: true,
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
    })
    
    // Fetch other required data
    const [categoriesRes, globalRes] = await Promise.all([
      fetchAPI("/categories", { fields: ["name", "slug"] }),
      fetchAPI("/global", { populate: "*" }),
    ])

    if (!articlesRes.data.length) {
      return { notFound: true }
    }

    return {
      props: { 
        article: articlesRes.data[0], 
        categories: categoriesRes.data,
        global: globalRes.data,
      },
      // No revalidate needed with static export + client-side fetching
    }
  } catch (error) {
    console.error('Error in getStaticProps:', error)
    return { notFound: true }
  }
}

export default Article