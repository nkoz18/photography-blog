import App from "next/app"
import Head from "next/head"
import "../assets/css/style.css"
import { createContext } from "react"
import { fetchAPI } from "../lib/api"
import { getStrapiMedia } from "../lib/media"

// Store Strapi Global object in context
export const GlobalContext = createContext({})

const MyApp = ({ Component, pageProps }) => {
  const { global } = pageProps

  return (
    <>
      <Head>
        <link
          rel="shortcut icon"
          href={getStrapiMedia(global.attributes.favicon)}
        />
      </Head>
      <GlobalContext.Provider value={global.attributes}>
        <Component {...pageProps} />
      </GlobalContext.Provider>
    </>
  )
}

MyApp.getInitialProps = async (ctx) => {
  try {
    // Calls page's `getInitialProps` and fills `appProps.pageProps`
    const appProps = await App.getInitialProps(ctx)
    //Fetch global site settings from Strapi
    const globalRes = await fetchAPI("/global", {
      populate: {
        favicon: {
          fields: ["url"] // Only fetch the 'url' field of the favicon
        },
        defaultSeo: {
          populate: {
              shareImage:{
                fields: ["url"]
              }
          }
        },
      },
    })
    // Pass the data to our page via props
    return { ...appProps, pageProps: { global: globalRes.data } }
  } catch (err) {
    console.log(err)
    return { notFound: true }
  }
}

export default MyApp