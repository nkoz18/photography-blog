import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Articles from "../../components/articles"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import Seo from "../../components/seo"

const Category = ({ category: staticCategory, categories: staticCategories }) => {
  const router = useRouter()
  const [category, setCategory] = useState(staticCategory)
  const [categories, setCategories] = useState(staticCategories)
  const [loading, setLoading] = useState(false)

  // Always fetch fresh data from CMS on page load to show latest content
  useEffect(() => {
    const fetchFreshData = async () => {
      if (!router.query.slug) return
      
      setLoading(true)
      try {
        const [matchingCategories, allCategories] = await Promise.all([
          fetchAPI("/categories", {
            filters: { slug: router.query.slug },
            populate: {
              articles: {
                filters: {
                  publishedAt: {
                    $notNull: true,
                  },
                },
                populate: {
                  image: {
                    fields: ["url", "alternativeText", "caption"],
                  },
                  categories: {
                    fields: ["name", "slug"],
                  },
                  author: {
                    fields: ["name"],
                  },
                },
                sort: ['publishedAt:desc'], // Show newest articles first
              },
            },
          }),
          fetchAPI("/categories", {
            populate: {
              fields: ["name", "slug"],
            },
          })
        ])
        
        if (matchingCategories.data && matchingCategories.data.length > 0) {
          console.log("Fetched fresh category data:", matchingCategories.data[0])
          setCategory(matchingCategories.data[0])
          setCategories(allCategories)
        }
      } catch (error) {
        console.error("Error fetching fresh category data:", error)
        // Keep static data as fallback
      } finally {
        setLoading(false)
      }
    }
    
    fetchFreshData()
  }, [router.query.slug])

  const seo = {
    metaTitle: category?.attributes?.name || "Category",
    metaDescription: `All ${category?.attributes?.name || "category"} articles`,
  }

  return (
    <Layout categories={categories?.data || []}>
      <Seo seo={seo} />
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          {category?.attributes ? (
            <>
              <h1>{category.attributes.name}</h1>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Loading latest articles...</p>
                </div>
              ) : (
                <Articles articles={category.attributes.articles?.data || []} />
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <p>Loading category...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export async function getStaticPaths() {
  try {
    // Get all categories from Strapi
    const categoriesRes = await fetchAPI("/categories", { 
      fields: ["slug"],
    })

    return {
      paths: categoriesRes.data.map((category) => ({
        params: {
          slug: category.attributes.slug,
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
    const matchingCategories = await fetchAPI("/categories", {
      filters: { slug: params.slug },
      populate: {
        articles: {
          filters: {
            publishedAt: {
              $notNull: true,
            },
          },
          populate: {
            image: {
              fields: ["url", "alternativeText", "caption"],
            },
            categories: {
              fields: ["name", "slug"],
            },
            author: {
              fields: ["name"],
            },
          },
          sort: ['publishedAt:desc'], // Show newest articles first
        },
      },
    })
    const allCategories = await fetchAPI("/categories", {
      populate: {
        fields: ["name", "slug"],
      },
    })

    return {
      props: {
        category: matchingCategories.data[0],
        categories: allCategories,
      },
      // No revalidate needed with static export + client-side fetching
    }
  } catch (error) {
    console.error("Error in getStaticProps:", error)
    return {
      notFound: true,
    }
  }
}

export default Category
