import React from "react"
import Articles from "../components/articles"
import Layout from "../components/layout"
import Seo from "../components/seo"
import { fetchAPI } from "../lib/api"

const Home = ({ articles, categories, homepage }) => {
  return (
    <Layout categories={categories}>
      <Seo seo={homepage.attributes.seo} />
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          {/* <h1>{homepage.attributes.hero.title}</h1> */}
          <Articles articles={articles} />
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps() {
  try {
    const [articlesRes, categoriesRes, homepageRes] = await Promise.all([
      fetchAPI("/articles", { 
        populate: {
          image: { fields: ["url", "alternativeText", "caption"] },
          category: { fields: ["name", "slug"] },
        }
      }),
      fetchAPI("/categories", { 
        populate: {
          fields: ["name", "slug"]
        }
      }),
      fetchAPI("/homepage", {
        populate: {
          hero: { populate: "*" },
          seo: { populate: { shareImage: { fields: ["url"] } } }
        },
      }),
    ]);

    return {
      props: {
        articles: articlesRes.data.reverse(), // ✅ Ensures newest articles are first
        categories: categoriesRes.data,
        homepage: homepageRes.data,
      },
    };
  } catch (err) {
    console.log(err);
    return { notFound: true };
  }
}


export default Home