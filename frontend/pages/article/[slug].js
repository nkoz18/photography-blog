import ReactMarkdown from "react-markdown"
import Moment from "react-moment"
import { fetchAPI } from "../../lib/api"
import Layout from "../../components/layout"
import NextImage from "../../components/image"
import Seo from "../../components/seo"
import Gallery from "../../components/gallery"
import { getStrapiMedia } from "../../lib/media"

const Article = ({ article, categories }) => {
  const seo = {
    metaTitle: article.attributes.title,
    metaDescription: article.attributes.description,
    shareImage: article.attributes.image,
    article: true,
  }

  return (
    <Layout categories={categories.data}>
      <Seo seo={seo} />
      {/* Cover Image - Full Width */}
      <div className="uk-section uk-section-small uk-padding-remove-vertical">
        <div className="uk-container uk-container-large">
          {article.attributes.image && (
            <div className="uk-width-1-1">
              <NextImage image={article.attributes.image} />
            </div>
          )}
        </div>
      </div>
      {/* Article Title and Content */}
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          <h1 className="uk-article-title">{article.attributes.title}</h1>

          <div className="uk-text-meta uk-margin-bottom">
            <Moment format="MMM Do, YYYY">
              {article.attributes.published_at}
            </Moment>
            {" by "}{article.attributes.author.data.attributes.name}
          </div>

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
  const articlesRes = await fetchAPI("/articles", {
    filters: {
      slug: params.slug,
    },
    populate: {
        image: {
            fields: ["url", "alternativeText", "caption", "width", "height"]
        },
        images: {
            fields: ["url", "alternativeText", "caption", "width", "height"]
        },
        author: {
            populate: {
                picture: {
                    fields: ["url"]
                }
            }
        },
        category: {
            fields: ["name", "slug"]
        }
    },
  })
  const categoriesRes = await fetchAPI("/categories", {
    populate: {
        fields: ["name", "slug"]
    }
  })

  return {
    props: { article: articlesRes.data[0], categories: categoriesRes }
  }
}

export default Article