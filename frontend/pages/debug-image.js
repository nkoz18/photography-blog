// pages/debug-image.js
import React from 'react';
import { fetchAPI } from '../lib/api';
import { getStrapiMedia, getStrapiImageUrl } from '../lib/media';
import Layout from '../components/layout';

const DebugImagePage = ({ articles, categories }) => {
  // Find first article with an image
  const articleWithImage = articles.find(article => article.attributes.image?.data);
  
  // If no image found
  if (!articleWithImage) {
    return (
      <Layout categories={categories}>
        <div className="uk-container uk-container-large">
          <h1>No articles with images found</h1>
        </div>
      </Layout>
    );
  }
  
  // Extract image data
  const image = articleWithImage.attributes.image;
  const imageUrl = getStrapiMedia(image);
  
  // Create direct URL for testing
  const directUrl = image.data?.attributes?.url 
    ? `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${image.data.attributes.url}`
    : 'Unable to construct URL';
  
  return (
    <Layout categories={categories}>
      <div className="uk-container uk-container-large uk-padding">
        <h1>Image Debug</h1>
        
        <div className="uk-margin">
          <h2>Image URLs</h2>
          <p><strong>From getStrapiMedia:</strong> {imageUrl}</p>
          <p><strong>Direct URL construction:</strong> {directUrl}</p>
        </div>
        
        <div className="uk-margin">
          <h2>HTML img Test</h2>
          <img 
            src={imageUrl} 
            alt="Test" 
            style={{ maxWidth: '500px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div className="uk-margin">
          <h2>Direct URL Test</h2>
          <img 
            src={directUrl}
            alt="Direct test" 
            style={{ maxWidth: '500px', border: '1px solid #ccc' }} 
          />
        </div>
        
        <div className="uk-margin">
          <h2>Image Data Structure</h2>
          <pre className="uk-background-muted uk-padding-small" style={{ overflow: 'auto' }}>
            {JSON.stringify(image, null, 2)}
          </pre>
        </div>
      </div>
    </Layout>
  );
};

export async function getServerSideProps() {
  try {
    const [articlesRes, categoriesRes] = await Promise.all([
      fetchAPI("/articles", { 
        populate: {
          image: { fields: ["url", "alternativeText", "caption", "width", "height"] },
          category: { fields: ["name", "slug"] },
        }
      }),
      fetchAPI("/categories", { 
        populate: {
          fields: ["name", "slug"]
        }
      }),
    ]);

    return {
      props: {
        articles: articlesRes.data || [],
        categories: categoriesRes.data || [],
      },
    };
  } catch (err) {
    console.error("Error fetching data:", err);
    return { 
      props: { 
        articles: [],
        categories: [],
        error: err.message
      } 
    };
  }
}

export default DebugImagePage;