import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from "../components/layout"
import Seo from "../components/seo"
import { fetchAPI } from "../lib/api"

const Custom404 = () => {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const goHomeButtonRef = useRef(null)

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

    // Fetch categories for navigation
    const fetchCategories = async () => {
      try {
        const categoriesRes = await fetchAPI("/categories", {
          populate: {
            fields: ["name", "slug"],
          },
        })
        setCategories(categoriesRes.data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories([])
      }
    }

    fetchCategories()
  }, [router])

  // Initialize rough.js for Go Home button
  useEffect(() => {
    if (typeof window !== 'undefined' && goHomeButtonRef.current) {
      import('roughjs/bundled/rough.esm').then((roughModule) => {
        const rough = roughModule.default
        
        const canvas = goHomeButtonRef.current
        const rc = rough.canvas(canvas)
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        rc.rectangle(10, 10, canvas.width - 20, canvas.height - 20, {
          fill: '#ff007f',
          fillStyle: 'solid',
          stroke: '#ff007f',
          strokeWidth: 3,
          roughness: 1.5,
          bowing: 2
        })
      }).catch(console.error)
    }
  }, [])

  const seo = {
    metaTitle: "Page Not Found",
    metaDescription: "The page you're looking for doesn't exist.",
    noindex: true,
  }

  return (
    <Layout categories={categories}>
      <Seo seo={seo} />
      <div className="uk-section" style={{ minHeight: '60vh' }}>
        <div className="uk-container uk-container-large">
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 0',
            // Ensure consistent appearance regardless of CSS loading
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <h1 style={{ 
              fontSize: '4rem', 
              margin: '0 0 1rem 0', 
              color: '#ff007f',
              fontWeight: 'bold'
            }}>404</h1>
            <h2 style={{ 
              margin: '0 0 2rem 0',
              fontSize: '1.5rem',
              fontWeight: 'normal'
            }}>Page Not Found</h2>
            <p style={{ 
              margin: '0 0 2rem 0', 
              opacity: 0.7,
              fontSize: '1rem',
              lineHeight: '1.5'
            }}>
              The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <canvas
                ref={goHomeButtonRef}
                width={180}
                height={60}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '180px',
                  height: '60px',
                  pointerEvents: 'none'
                }}
              />
              <Link href="/">
                <a style={{ 
                  position: 'relative',
                  display: 'inline-block',
                  color: 'white',
                  padding: '18px 32px',
                  textDecoration: 'none',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  background: 'transparent',
                  zIndex: 1,
                  width: '180px',
                  height: '60px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  Go Home
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Custom404