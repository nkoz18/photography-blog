import React, { useEffect, useState, useRef } from "react"
import Konami from "konami"

const KonamiEasterEgg = () => {
  const [showCharacter, setShowCharacter] = useState(false)
  const [position, setPosition] = useState(-100) // Start off-screen
  const [direction, setDirection] = useState(1) // 1 for right-to-left, -1 for left-to-right
  const [verticalOffset, setVerticalOffset] = useState(0) // For bobbing animation
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [currentCharacter, setCurrentCharacter] = useState("silky") // Default character
  const audioRef = useRef(null)
  const animationRef = useRef(null)
  const audioPlaying = useRef(false)
  const imageRef = useRef(null)
  const animationActiveRef = useRef(false) // Track if animation is active

  // Available characters
  const availableCharacters = [
    "silky",
    "gucci",
    "bulrog",
    "gon",
    "gman",
    "mantis",
  ]

  // Fallback image path
  const fallbackImagePath = "/images/icons/hamburger.svg"

  // Animation configuration
  const MOVE_SPEED = 5 // Pixels to move per frame - adjust for speed
  const BOB_AMPLITUDE = 30 // Max pixels to move up/down
  const BOB_FREQUENCY = 0.004 // Controls speed of bobbing

  useEffect(() => {
    // Initialize Konami code listener
    const easterEgg = new Konami(() => {
      console.log("Konami code entered!")
      triggerEasterEgg()
    })

    // Add proper touch support for mobile devices that follows Konami pattern
    // This implementation intentionally doesn't do anything. We'll rely on the
    // konami.js library to handle touch events properly, as it already has that
    // functionality built in.

    // Preload images to test if they're accessible
    availableCharacters.forEach((character) => {
      const preloadImage = new Image()
      preloadImage.src = `/easter-egg/images/${character}.png`
      console.log(`Preloading ${character}.png`)
    })

    return () => {
      // Clean up animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }

      // Ensure audio is stopped before unmounting
      if (audioRef.current && audioPlaying.current) {
        try {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioPlaying.current = false
        } catch (err) {
          console.error("Error stopping audio:", err)
        }
      }

      // Stop all animations and clean up
      animationActiveRef.current = false
      setShowCharacter(false)

      if (easterEgg && typeof easterEgg.disable === "function") {
        easterEgg.disable()
      }
    }
  }, [])

  const selectRandomCharacter = () => {
    const randomIndex = Math.floor(Math.random() * availableCharacters.length)
    return availableCharacters[randomIndex]
  }

  const triggerEasterEgg = () => {
    // Reset any ongoing animation
    if (animationActiveRef.current) {
      animationActiveRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    // Pick a random character
    const character = selectRandomCharacter()
    setCurrentCharacter(character)
    console.log(`Selected character: ${character}`)

    // Start a new animation
    animationActiveRef.current = true

    // Randomly decide starting side: true = start from right, false = start from left
    const startFromRight = Math.random() < 0.5

    // Set initial position based on direction
    const startPos = startFromRight ? window.innerWidth + 100 : -100
    setPosition(startPos)

    // Set direction based on starting position
    // If starting from right, character moves left (direction = 1)
    // If starting from left, character moves right (direction = -1)
    const newDirection = startFromRight ? 1 : -1
    setDirection(newDirection)

    // Reset vertical offset
    setVerticalOffset(0)

    setShowCharacter(true)
    console.log("Easter egg triggered - Character should show now")
    console.log("Using character:", character)
    console.log(
      "Animation direction:",
      startFromRight ? "Right to Left" : "Left to Right"
    )
    console.log("Starting position:", startPos)
    console.log(
      "Bobbing config - Amplitude:",
      BOB_AMPLITUDE,
      "Frequency:",
      BOB_FREQUENCY
    )

    // Play sound
    if (audioRef.current) {
      try {
        // Update audio source to match the current character
        audioRef.current.src = `/easter-egg/sounds/${character}.mp3`
        audioRef.current.currentTime = 0
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audioPlaying.current = true
              console.log("Audio playing successfully")
            })
            .catch((err) => {
              audioPlaying.current = false
              console.error("Error playing audio:", err)
            })
        }
      } catch (err) {
        console.error("Error setting up audio playback:", err)
      }
    }

    // Clear any previous animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    // Animation variables
    let startTime = null
    let currentPos = startPos
    let frameCount = 0

    // Animation function
    const animate = (timestamp) => {
      if (!animationActiveRef.current) return

      // Initialize start time
      if (!startTime) startTime = timestamp

      // Calculate elapsed time
      const elapsed = timestamp - startTime

      // Update position based on direction and speed
      currentPos = startPos - (newDirection * MOVE_SPEED * elapsed) / 16.67 // 16.67ms is approx one frame at 60fps

      // Calculate bobbing effect
      const bobOffset = Math.sin(elapsed * BOB_FREQUENCY) * BOB_AMPLITUDE

      // Update state values
      setPosition(currentPos)
      setVerticalOffset(bobOffset)

      frameCount++

      // Log position occasionally
      if (frameCount % 60 === 0) {
        console.log(
          "Animation frame:",
          frameCount,
          "Position:",
          Math.round(currentPos),
          "Vertical:",
          Math.round(bobOffset)
        )
      }

      // Check if character has moved off screen
      if (
        (startFromRight && currentPos < -100) || // Started right, moved left off screen
        (!startFromRight && currentPos > window.innerWidth + 100) // Started left, moved right off screen
      ) {
        console.log("Character moved off screen, ending animation")
        animationActiveRef.current = false
        setShowCharacter(false)
        return
      }

      // Continue animation
      if (animationActiveRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)
  }

  // Always render the audio element, even when character is not showing
  // This ensures the audio element isn't removed during playback
  return (
    <>
      <audio ref={audioRef} preload="auto" />
      {showCharacter && (
        <div
          style={{
            position: "fixed",
            zIndex: 9999,
            top: "50%",
            left: `${position}px`,
            transform: `translateY(calc(-50% + ${verticalOffset}px))`,
            pointerEvents: "none", // Prevent character from blocking clicks
          }}
        >
          {/* Display the randomly selected character */}
          <img
            ref={imageRef}
            src={
              useFallback
                ? fallbackImagePath
                : `/easter-egg/images/${currentCharacter}.png`
            }
            alt="Easter Egg Character"
            onLoad={() => {
              console.log("Image loaded successfully!")
              setImageLoaded(true)
              // Log dimensions to verify image is properly loaded
              if (imageRef.current) {
                console.log(
                  "Image dimensions:",
                  imageRef.current.naturalWidth,
                  "x",
                  imageRef.current.naturalHeight
                )
              }
            }}
            onError={(e) => {
              console.error("Image failed to load:", e.currentTarget.src)
              if (!useFallback) {
                console.log("Switching to fallback image")
                setUseFallback(true)
              }
            }}
            style={{
              maxHeight: "240px",
              maxWidth: "240px",
              width: "auto",
              height: "auto",
              filter: "drop-shadow(0 0 10px rgba(0,0,0,0.3))", // Add shadow for visibility
              transform: direction === 1 ? "scaleX(-1)" : "scaleX(1)", // Flip image based on direction
            }}
          />
        </div>
      )}
    </>
  )
}

export default KonamiEasterEgg
