import React, { useEffect, useState } from "react"
import Articles from "../components/articles"
import Layout from "../components/layout"
import Seo from "../components/seo"
import { fetchAPI } from "../lib/api"

const Home = ({ articles, categories, homepage, isStaticExport }) => {
  const [clientData, setClientData] = useState({
    articles: articles || [],
    categories: categories || [],
    homepage: homepage || {
      attributes: {
        seo: {
          metaTitle: "Photography Blog",
          metaDescription:
            "A beautiful photography blog showcasing amazing images",
        },
      },
    },
  })
  const [loading, setLoading] = useState(false)

  // For static export builds, fetch data client-side
  useEffect(() => {
    const fetchData = async () => {
      if (isStaticExport) {
        try {
          setLoading(true)

          // Fetch articles and categories which we know are available
          const [articlesRes, categoriesRes] = await Promise.all([
            fetchAPI("/articles", {
              populate: {
                image: { fields: ["url", "alternativeText", "caption"] },
                category: { fields: ["name", "slug"] },
              },
            }),
            fetchAPI("/categories", {
              populate: {
                fields: ["name", "slug"],
              },
            }),
          ])

          // Try to fetch homepage, but handle the case where it's not available
          let homepageData = null
          try {
            const homepageRes = await fetchAPI("/homepage", {
              populate: {
                hero: { populate: "*" },
                seo: { populate: { shareImage: { fields: ["url"] } } },
              },
            })
            homepageData = homepageRes.data
          } catch (error) {
            console.log("Failed to fetch homepage data:", error.message)
            // Provide a fallback for homepage data
            homepageData = {
              attributes: {
                hero: {
                  title: "Photography Blog",
                },
                seo: {
                  metaTitle: "Photography Blog",
                  metaDescription:
                    "A beautiful photography blog showcasing amazing images",
                },
              },
            }
          }

          setClientData({
            articles: articlesRes.data.reverse(),
            categories: categoriesRes.data,
            homepage: homepageData,
          })
        } catch (error) {
          console.error("Error fetching client-side data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [isStaticExport])

  // Use client-side data for static exports, otherwise use server props
  const data = isStaticExport ? clientData : { articles, categories, homepage }

  return (
    <Layout categories={data.categories}>
      <Seo seo={data.homepage.attributes.seo} />
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          {/* <h1>{homepage.attributes.hero.title}</h1> */}
          {loading ? (
            <div>Loading content...</div>
          ) : (
            <Articles articles={data.articles} />
          )}
        </div>
      </div>
    </Layout>
  )
}

// Use getStaticProps instead of getServerSideProps for static export
export async function getStaticProps() {
  // For static export, provide minimal data that will be enhanced client-side
  const isExport = process.env.NEXT_PHASE === "phase-export"

  if (isExport) {
    return {
      props: {
        articles: [],
        categories: [],
        homepage: {
          attributes: {
            seo: {
              metaTitle: "Photography Blog",
              metaDescription:
                "A beautiful photography blog showcasing amazing images",
            },
          },
        },
      },
    }
  }

  try {
    // Fetch articles and categories which we know are available
    const [articlesRes, categoriesRes] = await Promise.all([
      fetchAPI("/articles", {
        populate: {
          image: { fields: ["url", "alternativeText", "caption"] },
          category: { fields: ["name", "slug"] },
        },
      }),
      fetchAPI("/categories", {
        populate: {
          fields: ["name", "slug"],
        },
      }),
    ])

    // Try to fetch homepage, but handle the case where it's not available
    let homepageData = null
    try {
      const homepageRes = await fetchAPI("/homepage", {
        populate: {
          hero: { populate: "*" },
          seo: { populate: { shareImage: { fields: ["url"] } } },
        },
      })
      homepageData = homepageRes.data
    } catch (error) {
      console.log("Failed to fetch homepage data:", error.message)
      // Provide a fallback for homepage data
      homepageData = {
        attributes: {
          hero: {
            title: "Photography Blog",
          },
          seo: {
            metaTitle: "Photography Blog",
            metaDescription:
              "A beautiful photography blog showcasing amazing images",
          },
        },
      }
    }

    return {
      props: {
        articles: articlesRes.data.reverse(), // Ensures newest articles are first
        categories: categoriesRes.data,
        homepage: homepageData,
      },
      // Revalidate the page every 10 minutes
      revalidate: 600,
    }
  } catch (err) {
    console.log("Error fetching main data:", err)
    return {
      props: {
        articles: [],
        categories: [],
        homepage: {
          attributes: {
            seo: {
              metaTitle: "Photography Blog",
              metaDescription:
                "A beautiful photography blog showcasing amazing images",
            },
          },
        },
      },
    }
  }
}

export default Home
