import App from "next/app"
import Head from "next/head"
import "../assets/css/style.css"
import { createContext, useEffect, useState } from "react"
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
  // State to store global data loaded client-side
  const [clientGlobal, setClientGlobal] = useState(null)
  const [loading, setLoading] = useState(false)

  // Determine if we're in a static export
  const isStaticExport = typeof window !== "undefined" && !pageProps?.global

  // Add fallback for global data if it's missing
  const global =
    isStaticExport && clientGlobal
      ? clientGlobal
      : pageProps?.global || {
          attributes: {
            favicon: { data: null },
            defaultSeo: {
              metaTitle: "Silky Truth Photography",
              metaDescription: "Beautiful photography from around the world",
              shareImage: null,
            },
          },
        }

  // In client-side, fetch global data if not available
  useEffect(() => {
    const loadGlobalData = async () => {
      if (isStaticExport && !clientGlobal) {
        try {
          setLoading(true)
          const globalRes = await fetchAPI("/global", {
            populate: {
              favicon: {
                fields: ["url"],
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
          setClientGlobal(globalRes.data)
        } catch (err) {
          console.warn("Failed to fetch global data client-side:", err.message)
        } finally {
          setLoading(false)
        }
      }
    }

    loadGlobalData()
  }, [isStaticExport, clientGlobal])

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalContext.Provider value={global.attributes}>
        <Component {...pageProps} isStaticExport={isStaticExport} />
        <KonamiEasterEgg />
      </GlobalContext.Provider>
    </>
  )
}

MyApp.getInitialProps = async (ctx) => {
  // Skip server-side data fetching during static export
  const isStaticExport = process.env.NEXT_PHASE === "phase-export"

  try {
    // Calls page's `getInitialProps` and fills `appProps.pageProps`
    const appProps = await App.getInitialProps(ctx)

    // Skip data fetching in static export mode
    if (isStaticExport || !ctx.ctx.req) {
      return {
        ...appProps,
        pageProps: { ...appProps.pageProps, global: null },
      }
    }

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
