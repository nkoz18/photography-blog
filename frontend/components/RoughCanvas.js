import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import rough from 'roughjs'

/**
 * RoughCanvas component for drawing hand-drawn style boxes and UI elements
 * Replaces the static SVG background with dynamic rough.js drawings
 */
const RoughCanvas = ({ 
  width = 400, 
  height = 300, 
  mode = 'main', // 'main', 'yes-button', 'no-button', 'option-button'
  text = '',
  roughness = 1.5,
  className = '',
  onClick,
  disabled = false,
  children 
}) => {
  const canvasRef = useRef(null)
  const [isClient, setIsClient] = useState(false)
  
  // Colors from your design system
  const primaryColor = '#ff007f' // Your pink color
  const whiteColor = '#ffffff'
  
  // Ensure we only render on client to avoid SSR issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !canvasRef.current) return

    const canvas = canvasRef.current
    const rc = rough.canvas(canvas)
    const ctx = canvas.getContext('2d')
    
    // Set canvas size with device pixel ratio for crisp rendering
    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = width * devicePixelRatio
    canvas.height = height * devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(devicePixelRatio, devicePixelRatio)
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Draw based on mode
    switch (mode) {
      case 'main':
        // Main modal background box - solid pink fill, increased roughness
        rc.rectangle(10, 10, width - 20, height - 20, {
          fill: '#ff007f',
          fillStyle: 'solid',
          stroke: '#ff007f',
          strokeWidth: 3,
          roughness: 2.2,
          bowing: 3
        })
        break
        
      case 'yes-button':
      case 'no-button':
      case 'option-button':
        // Button boxes - white fill with pink text, reduced roughness
        rc.rectangle(5, 5, width - 10, height - 10, {
          fill: '#ffffff',
          fillStyle: 'solid',
          stroke: '#ff007f',
          strokeWidth: 2,
          roughness: 1.8,
          bowing: 2
        })
        break
        
      case 'close-button':
        // Close button - small square with reduced roughness
        rc.rectangle(2, 2, width - 4, height - 4, {
          fill: '#ffffff',
          fillStyle: 'solid',
          stroke: '#ff007f',
          strokeWidth: 2,
          roughness: 2.0,
          bowing: 3
        })
        break
        
      default:
        // Default rectangle
        rc.rectangle(5, 5, width - 10, height - 10, {
          fill: '#ff007f',
          fillStyle: 'solid',
          stroke: '#ff007f',
          strokeWidth: 2,
          roughness: roughness,
          bowing: 2
        })
    }
    
  }, [width, height, mode, roughness, isClient])

  if (!isClient) {
    // Return a placeholder div during SSR
    return (
      <div 
        className={`rough-canvas-placeholder ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    )
  }

  const canvasElement = (
    <canvas
      ref={canvasRef}
      className={`rough-canvas ${className} ${mode === 'main' ? '' : 'rough-canvas-button'}`}
      onClick={onClick}
      style={{
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.6 : 1,
        display: 'block'
      }}
    />
  )

  // For button modes, wrap in motion.div for animations
  if (mode !== 'main' && onClick) {
    return (
      <motion.div
        className={`rough-canvas-container ${className}`}
        style={{ position: 'relative', display: 'inline-block' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
      >
        {canvasElement}
        {(text || children) && (
          <div 
            className="rough-canvas-text"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'Barriecito, cursive',
              color: mode === 'main' ? whiteColor : primaryColor,
              fontSize: mode === 'option-button' ? '24px' : (mode === 'yes-button' || mode === 'no-button' ? '34px' : '24px'),
              fontWeight: mode === 'option-button' ? 'bolder' : 'normal',
              textAlign: 'center',
              textTransform: mode === 'option-button' ? 'none' : 'uppercase',
              letterSpacing: mode === 'option-button' ? '2.5px' : '0',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          >
            {text || children}
          </div>
        )}
      </motion.div>
    )
  }

  // For main background, just return the canvas
  return canvasElement
}

export default RoughCanvas