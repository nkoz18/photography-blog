import App from "next/app"
import Head from "next/head"
import "../assets/css/style.css"
import { createContext } from "react"
import { fetchAPI } from "../lib/api"
import { getStrapiMedia } from "../lib/media"
import dynamic from "next/dynamic"

// Dynamically import KonamiEasterEgg with no SSR
const KonamiEasterEgg = dynamic(() => import("../components/KonamiEasterEgg"), {
  ssr: false,
})

// Store Strapi Global object in context
export const GlobalContext = createContext({})

const MyApp = ({ Component, pageProps }) => {
  // Add fallback for global data if it's missing
  const global = pageProps?.global || {
    attributes: {
      favicon: { data: null },
      defaultSeo: {
        metaTitle: "Silky Truth Photography",
        metaDescription: "Beautiful photography from around the world",
        shareImage: null,
      },
    },
  }

  // Safely get favicon URL without causing errors
  const getFaviconUrl = () => {
    try {
      if (global.attributes.favicon?.data) {
        return getStrapiMedia(global.attributes.favicon)
      }
      return "/favicon.ico" // Default favicon path
    } catch (err) {
      console.warn("Error loading favicon:", err)
      return "/favicon.ico"
    }
  }

  return (
    <>
      <Head>
        <link rel="shortcut icon" href={getFaviconUrl()} />
        <title>Silky Truth Photography</title>
      </Head>
      <GlobalContext.Provider value={global.attributes}>
        <Component {...pageProps} />
        <KonamiEasterEgg />
      </GlobalContext.Provider>
    </>
  )
}

MyApp.getInitialProps = async (ctx) => {
  try {
    // Calls page's `getInitialProps` and fills `appProps.pageProps`
    const appProps = await App.getInitialProps(ctx)

    try {
      //Fetch global site settings from Strapi
      const globalRes = await fetchAPI("/global", {
        populate: {
          favicon: {
            fields: ["url"], // Only fetch the 'url' field of the favicon
          },
          defaultSeo: {
            populate: {
              shareImage: {
                fields: ["url"],
              },
            },
          },
        },
      })

      // Pass the data to our page via props
      return {
        ...appProps,
        pageProps: { ...appProps.pageProps, global: globalRes.data },
      }
    } catch (err) {
      console.warn("Failed to fetch global data:", err.message)
      // Return the appProps without global data if the fetch fails
      return {
        ...appProps,
        pageProps: {
          ...appProps.pageProps,
          global: null, // Explicitly set global to null to trigger fallback
        },
      }
    }
  } catch (err) {
    console.error("App getInitialProps error:", err)
    return {
      ...(await App.getInitialProps(ctx)),
      pageProps: { global: null },
    }
  }
}

export default MyApp
