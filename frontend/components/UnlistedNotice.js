import { useEffect, useRef } from 'react'
import rough from 'roughjs'

const UnlistedNotice = () => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    
    if (!canvas || !container) return

    // Set canvas size based on container
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      
      // Clear canvas
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw rough.js rectangle
      const rc = rough.canvas(canvas)
      rc.rectangle(10, 10, canvas.width - 20, canvas.height - 20, {
        stroke: '#ff007f',
        strokeWidth: 3,
        roughness: 2.5,
        fill: '#ff007f',
        fillStyle: 'solid',
        fillWeight: 1,
      })
    }

    updateCanvasSize()
    
    // Handle resize
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="unlisted-notice-container"
      style={{
        position: 'relative',
        marginBottom: '2rem',
        padding: '1.5rem 2rem',
        minHeight: '80px',
        maxWidth: '585px',
        margin: '2rem auto'
      }}
    >
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
      <div 
        style={{
          position: 'relative',
          zIndex: 1,
          color: 'white',
          fontWeight: '500',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}
      >
        <span style={{ marginRight: '0.5rem' }}>🔒</span>
        This article is unlisted and won&apos;t appear in search results or navigation.
        Only people with the direct link can view it.
      </div>
    </div>
  )
}

export default UnlistedNotice