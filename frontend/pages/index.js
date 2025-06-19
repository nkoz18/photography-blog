import React, { useEffect, useState } from "react"
import Articles from "../components/articles"
import Layout from "../components/layout"
import Seo from "../components/seo"
import { fetchAPI } from "../lib/api"

const Home = ({ articles: staticArticles, categories: staticCategories, homepage: staticHomepage }) => {
  const [data, setData] = useState({
    articles: staticArticles || [],
    categories: staticCategories || [],
    homepage: staticHomepage || {
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

  // Always fetch fresh data client-side to show latest content
  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true)

          // Fetch articles and categories which we know are available
          const [articlesRes, categoriesRes] = await Promise.all([
            fetchAPI("/articles", {
              filters: {
                publishedAt: {
                  $notNull: true,
                },
                listed: {
                  $eq: true,
                },
              },
              populate: {
                image: { fields: ["url", "alternativeText", "caption"] },
                category: { fields: ["name", "slug"] },
                author: { fields: ["name"] },
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

          setData({
            articles: articlesRes.data.reverse(),
            categories: categoriesRes.data,
            homepage: homepageData,
          })
        } catch (error) {
          console.error("Error fetching client-side data:", error)
          // Keep static data as fallback
        } finally {
          setLoading(false)
        }
    }

    fetchData()
  }, [])

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

export async function getStaticProps() {

  try {
    // Fetch articles and categories which we know are available
    const [articlesRes, categoriesRes] = await Promise.all([
      fetchAPI("/articles", {
        filters: {
          publishedAt: {
            $notNull: true,
          },
          listed: {
            $eq: true,
          },
        },
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
      // No revalidate needed with static export + client-side fetching
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
