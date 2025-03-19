import ReactMarkdown from "react-markdown"
import Moment from "react-moment"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import NextImage from "../../components/image"
import Seo from "../../components/seo"
import Gallery from "../../components/gallery"
import { getStrapiMedia } from "../../lib/media"

const Article = ({ article, categories }) => {
  if (!article) {
    return { notFound: true } // 404 if article is missing
  }

  const seo = {
    metaTitle: article.attributes.title,
    metaDescription: article.attributes.description,
    shareImage: article.attributes.image,
    article: true,
  }

  return (
    <Layout categories={categories}>
      <Seo seo={seo} />
      {/* Cover Image - Full Width */}
      <div className="uk-section uk-section-small uk-padding-remove-vertical">
          {article.attributes.image && (
            <div className="article-cover-image">
              <NextImage image={article.attributes.image} />
            </div>
          )}
      </div>
      {/* Article Title and Content */}
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          <h1 className="uk-article-title">{article.attributes.title}</h1>
          <div className="uk-article-content">
            <ReactMarkdown
              source={article.attributes.content}
              escapeHtml={false}
            />
          </div>
        </div>
      </div>

      {/* Gallery - Below Content */}
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          <Gallery images={article.attributes.images} />
        </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ params }) {
  const [articlesRes, categoriesRes] = await Promise.all([
    fetchAPI("/articles", {
      filters: { slug: params.slug },
      populate: {
        image: { fields: ["url", "alternativeText", "caption", "width", "height"] },
        images: { fields: ["url", "alternativeText", "caption", "width", "height"] },
        author: { populate: { picture: { fields: ["url"] } } },
        categories: { fields: ["name", "slug"] },
      },
    }),
    fetchAPI("/categories", { fields: ["name", "slug"] }) // ✅ Fetch all categories for the navigation
  ]);

  if (!articlesRes.data.length) {
    return { notFound: true };
  }

  return {
    props: { article: articlesRes.data[0], categories: categoriesRes.data },
  };
}


export default Article
