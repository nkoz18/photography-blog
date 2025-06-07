import React, { useState, useEffect } from 'react'

// Number of icons available per position (we'll use numbered naming)
const iconCounts = {
  center: 8,  // 8 icons in center folder
  left: 10,   // 10 icons in left folder  
  right: 19   // 19 icons in right folder
}

// Global array to track used combinations
let usedCombinations = []

const HoverDoodle = ({ children, className = "" }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [position, setPosition] = useState('center')
  const [iconName, setIconName] = useState('')
  const [jitterOffset, setJitterOffset] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)

  // Set component as mounted and assign random position + icon
  useEffect(() => {
    setIsMounted(true)
    
    // Randomly choose position (left, center, or right)
    const positions = ['left', 'center', 'right']
    const randomPosition = positions[Math.floor(Math.random() * positions.length)]
    setPosition(randomPosition)
    
    // Get random icon number for this position
    const maxIcons = iconCounts[randomPosition]
    const randomNumber = Math.floor(Math.random() * maxIcons) + 1
    const iconFileName = `${randomPosition}_${randomNumber}.svg`
    setIconName(iconFileName)
    
    // Track this combination to avoid duplicates if needed
    const combination = `${randomPosition}-${iconFileName}`
    usedCombinations.push(combination)
  }, [])

  // Jitter animation effect (position only, no icon switching)
  useEffect(() => {
    if (!isHovered || !isMounted) return

    const jitterInterval = setInterval(() => {
      setJitterOffset({
        x: Math.random() * 4 - 2, // Random between -2 and 2 pixels
        y: Math.random() * 4 - 2
      })
    }, 100) // Jitter every 100ms

    return () => clearInterval(jitterInterval)
  }, [isHovered, isMounted])

  // Don't render doodles until mounted (SSR safety) and on mobile
  if (!isMounted) {
    return <>{children}</>
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  
  if (isMobile) {
    return <>{children}</>
  }

  const doodlePath = `/images/icons/accents/${position}/${iconName}`

  // Position styles based on selected position
  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute',
      top: '-8px',
      transform: `translate(${jitterOffset.x}px, ${jitterOffset.y}px)`,
      transition: 'transform 0.05s ease-out',
      pointerEvents: 'none',
      zIndex: 1000
    }

    switch (position) {
      case 'left':
        return { ...baseStyle, left: '-8px' }
      case 'right':
        return { ...baseStyle, right: '-8px' }
      case 'center':
        return { ...baseStyle, left: '50%', marginLeft: '-16px' } // Center with 32px/2 offset
      default:
        return { ...baseStyle, left: '-8px' }
    }
  }

  return (
    <div 
      className={`hover-doodle-container ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      {isHovered && (
        <div
          className="hover-doodle"
          style={getPositionStyle()}
        >
          <img 
            src={doodlePath} 
            alt={`Accent doodle ${position} ${iconName}`}
            style={{
              width: '28px',
              height: '28px',
              display: 'block'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default HoverDoodle