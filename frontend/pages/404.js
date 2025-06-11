import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from "../components/layout"
import Seo from "../components/seo"

const Custom404 = () => {
  const router = useRouter()

  useEffect(() => {
    // Check if this might be a tokenized URL
    const pathname = router.asPath
    
    // Pattern: /article/slug~token
    const tokenPattern = /^\/article\/([^~]+)~([a-zA-Z0-9]+)$/
    const match = pathname.match(tokenPattern)
    
    if (match) {
      const [, slug, token] = match
      // Redirect to the article page with the full slug~token
      router.replace(`/article/${slug}~${token}`)
      return
    }
  }, [router])

  const seo = {
    metaTitle: "Page Not Found",
    metaDescription: "The page you're looking for doesn't exist.",
    noindex: true,
  }

  return (
    <Layout categories={[]}>
      <Seo seo={seo} />
      <div className="uk-section">
        <div className="uk-container uk-container-large">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', color: '#ff007f' }}>404</h1>
            <h2 style={{ margin: '0 0 2rem 0' }}>Page Not Found</h2>
            <p style={{ margin: '0 0 2rem 0', opacity: 0.7 }}>
              The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
            <Link href="/">
              <a style={{ 
                display: 'inline-block',
                backgroundColor: '#ff007f',
                color: 'white',
                padding: '12px 24px',
                textDecoration: 'none',
                fontFamily: 'IBM Plex Mono, monospace'
              }}>
                Go Home
              </a>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Custom404