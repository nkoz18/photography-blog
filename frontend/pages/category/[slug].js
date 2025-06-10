import Articles from "../../components/articles"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import Seo from "../../components/seo"

const Category = ({ category, categories }) => {
  const seo = {
    metaTitle: category.attributes.name,
    metaDescription: `All ${category.attributes.name} articles`,
  }

  return (
    <Layout categories={categories.data}>
      <Seo seo={seo} />
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          <h1>{category.attributes.name}</h1>
          <Articles articles={category.attributes.articles.data} />
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
            category: {
              fields: ["name", "slug"],
            },
          },
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
