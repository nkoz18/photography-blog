import ReactMarkdown from "react-markdown"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import Image from "../../components/image"
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
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          {/* Cover Image - Content Width */}
          {article.attributes.image && (
            <div className="article-cover-image">
              <Image image={article.attributes.image} />
            </div>
          )}
          
          {/* Article Title and Content */}
          <h1 className="uk-article-title">{article.attributes.title}</h1>
          <div className="uk-article-content">
            <ReactMarkdown
              source={article.attributes.content}
              escapeHtml={false}
            />
          </div>
          
          {/* Gallery - Below Content */}
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
    fetchAPI("/categories", { fields: ["name", "slug"] })
  ]);

  if (!articlesRes.data.length) {
    return { notFound: true };
  }

  return {
    props: { article: articlesRes.data[0], categories: categoriesRes.data },
  };
}

export default Article