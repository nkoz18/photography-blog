import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import Konami from "konami"

// Move constants outside component to prevent recreating on every render
const AVAILABLE_CHARACTERS = [
  "silky",
  "gucci", 
  "bulrog",
  "gon",
  "gman",
  "mantis",
]

// Animation configuration
const MOVE_SPEED = 5 // Pixels to move per frame - adjust for speed
const BOB_AMPLITUDE = 30 // Max pixels to move up/down
const BOB_FREQUENCY = 0.004 // Controls speed of bobbing

// Gesture configuration
const SWIPE_TIMEOUT = 3000 // Increased time before gesture sequence resets (3 seconds)
const SWIPE_MIN_DISTANCE = 20 // Reduced minimum distance for a swipe

// Gesture types
const GESTURE = {
  UP: "UP",
  DOWN: "DOWN",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  A: "A",
  B: "B",
}

// The Konami Code sequence as gestures
const KONAMI_SEQUENCE = [
  GESTURE.UP,
  GESTURE.UP,
  GESTURE.DOWN,
  GESTURE.DOWN,
  GESTURE.LEFT,
  GESTURE.RIGHT,
  GESTURE.LEFT,
  GESTURE.RIGHT,
  GESTURE.B,
  GESTURE.A,
]

const KonamiEasterEgg = () => {
  const [showCharacter, setShowCharacter] = useState(false)
  const [position, setPosition] = useState(-100) // Start off-screen
  const [direction, setDirection] = useState(1) // 1 for right-to-left, -1 for left-to-right
  const [verticalOffset, setVerticalOffset] = useState(0) // For bobbing animation
  const [currentCharacter, setCurrentCharacter] = useState("silky") // Default character
  const [portalContainer, setPortalContainer] = useState(null)
  const audioRef = useRef(null)
  const animationRef = useRef(null)
  const audioPlaying = useRef(false)
  const imageRef = useRef(null)
  const animationActiveRef = useRef(false) // Track if animation is active
  const mobileInitializedRef = useRef(false) // Track if mobile listeners have been initialized

  // Konami code gesture tracking
  const gestureQueueRef = useRef([])
  const swipeStartXRef = useRef(null)
  const swipeStartYRef = useRef(null)
  const swipeEndXRef = useRef(null)
  const swipeEndYRef = useRef(null)
  const swipeDraggingRef = useRef(false)
  const lastGestureTimeRef = useRef(0)
  const gestureTimeoutRef = useRef(null)
  const expectedButtonRef = useRef(null) // Tracks whether next tap should be B or A

  // Fallback image path
  const fallbackImagePath = "/images/icons/hamburger.svg"

  // Set portal container once component mounts
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalContainer(document.body)
    }
  }, [])

  // Add a gesture to the queue and check for Konami code
  const addGestureToQueue = useCallback((gesture) => {
    const currentTime = new Date().getTime()

    // Reset if too much time passed since last gesture
    if (currentTime - lastGestureTimeRef.current > SWIPE_TIMEOUT) {

      gestureQueueRef.current = []
      expectedButtonRef.current = null // Reset expected button on timeout
    }

    // Clear any existing timeout
    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current)
    }

    // Special handling for taps on mobile - if we already have 8 directional gestures
    // and this is a tap, interpret it as B or A
    if (gesture === "TAP" && gestureQueueRef.current.length >= 8) {
      // If we have at least 8 gestures (all directions) and this is a tap,
      // we expect button B first, then A
      if (expectedButtonRef.current === null) {
        // First tap after directions should be B
        expectedButtonRef.current = GESTURE.B
        gesture = GESTURE.B

      } else if (expectedButtonRef.current === GESTURE.B) {
        // Second tap after B should be A
        expectedButtonRef.current = GESTURE.A
        gesture = GESTURE.A

      } else {
        // Reset if we get more taps after A
        expectedButtonRef.current = null
      }
    }

    // Add new gesture to queue
    gestureQueueRef.current.push(gesture)
    lastGestureTimeRef.current = currentTime

    // Limit queue size to match Konami sequence length
    if (gestureQueueRef.current.length > KONAMI_SEQUENCE.length) {
      gestureQueueRef.current.shift()
    }



    // Set timeout to reset sequence
    gestureTimeoutRef.current = setTimeout(() => {

      gestureQueueRef.current = []
      expectedButtonRef.current = null // Reset on timeout
    }, SWIPE_TIMEOUT)

    // Check if sequence matches Konami code
    const match =
      gestureQueueRef.current.length === KONAMI_SEQUENCE.length &&
      gestureQueueRef.current.every((g, i) => g === KONAMI_SEQUENCE[i])

    if (match) {
      gestureQueueRef.current = [] // Reset after successful detection
      expectedButtonRef.current = null // Reset expected button
      triggerEasterEgg()
      return true
    }

    return false
  }, [])



  // Define triggerEasterEgg with useCallback to avoid dependency issues
  const triggerEasterEgg = useCallback(() => {
    // Reset any ongoing animation
    if (animationActiveRef.current) {
      animationActiveRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }

    // Pick a random character
    const character =
      AVAILABLE_CHARACTERS[
        Math.floor(Math.random() * AVAILABLE_CHARACTERS.length)
      ]
    setCurrentCharacter(character)


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
      // Check if animation should continue - use a more reliable check
      if (!animationActiveRef.current) {

        return;
      }

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



      // Check if character has moved off screen
      if (
        (startFromRight && currentPos < -100) || // Started right, moved left off screen
        (!startFromRight && currentPos > window.innerWidth + 100) // Started left, moved right off screen
      ) {

        animationActiveRef.current = false
        setShowCharacter(false)
        return
      }

      // Continue animation
      if (animationActiveRef.current) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    // Use setTimeout to ensure state updates have been processed before starting animation
    setTimeout(() => {
      // Set animation active flag right before starting
      animationActiveRef.current = true

      // Start animation
      animationRef.current = requestAnimationFrame(animate)
    }, 0)

  }, [])

  useEffect(() => {
    // Initialize Konami code keyboard listener
    const easterEgg = new Konami(() => {
  
      triggerEasterEgg()
    })

    // Setup mobile detection and handlers
    const setupMobileHandlers = () => {
      if (mobileInitializedRef.current) return null // Prevent double initialization

      // Detect if device is mobile
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )

      if (!isMobileDevice) {
        return null
      }

      // Setup mobile handlers

      // Touch event handlers for mobile Konami code
      const handleTouchStart = (event) => {
        swipeDraggingRef.current = false
        swipeStartXRef.current = event.touches[0].clientX
        swipeStartYRef.current = event.touches[0].clientY
      }

      const handleTouchMove = (event) => {
        if (!swipeStartXRef.current || !swipeStartYRef.current) {
          return
        }

        swipeDraggingRef.current = true
        swipeEndXRef.current = event.touches[0].clientX
        swipeEndYRef.current = event.touches[0].clientY


      }

      const handleTouchEnd = (event) => {


        if (
          swipeDraggingRef.current &&
          swipeStartXRef.current !== null &&
          swipeEndXRef.current !== null
        ) {
          // This was a swipe
          const xDiff = swipeStartXRef.current - swipeEndXRef.current
          const yDiff = swipeStartYRef.current - swipeEndYRef.current



          // Minimum swipe distance to consider it intentional
          if (
            Math.abs(xDiff) < SWIPE_MIN_DISTANCE &&
            Math.abs(yDiff) < SWIPE_MIN_DISTANCE
          ) {
            // Too small of a movement, treat as tap instead

            addGestureToQueue("TAP")
          } else {
            const isHorizontal = Math.abs(xDiff) > Math.abs(yDiff)

            if (isHorizontal) {
              // Horizontal swipe - INVERTED for mobile
              // When you swipe left (xDiff > 0), content moves right, so we register RIGHT
              // When you swipe right (xDiff < 0), content moves left, so we register LEFT
              const gesture = xDiff > 0 ? GESTURE.RIGHT : GESTURE.LEFT

              addGestureToQueue(gesture)
            } else {
              // Vertical swipe - INVERTED for mobile
              // When you swipe up (yDiff > 0), content moves down, so we register DOWN
              // When you swipe down (yDiff < 0), content moves up, so we register UP
              const gesture = yDiff > 0 ? GESTURE.DOWN : GESTURE.UP

              addGestureToQueue(gesture)
            }
          }
        } else if (swipeStartXRef.current !== null) {
          // This was a tap with no movement

          addGestureToQueue("TAP")
        }

        // Reset touch tracking
        swipeDraggingRef.current = false
        swipeStartXRef.current = null
        swipeStartYRef.current = null
        swipeEndXRef.current = null
        swipeEndYRef.current = null
      }

      // Add touch listeners with passive: true to allow normal scrolling
      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      })
      document.addEventListener("touchmove", handleTouchMove, { passive: true })
      document.addEventListener("touchend", handleTouchEnd, { passive: true })

      mobileInitializedRef.current = true

      // Return cleanup function
      return () => {
        document.removeEventListener("touchstart", handleTouchStart)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)

      }
    }

    // Capture a reference to the audio element for proper cleanup
    const audio = audioRef.current

    // Initialize mobile handlers after a short delay
    const initTimeout = setTimeout(() => {
      if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        setupMobileHandlers()
      }
    }, 500)



    return () => {
      // Clean up animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }

      // Ensure audio is stopped before unmounting - using stored reference
      if (audio && audioPlaying.current) {
        try {
          audio.pause()
          audio.currentTime = 0
          audioPlaying.current = false
        } catch (err) {
          console.error("Error stopping audio:", err)
        }
      }

      // Stop all animations and clean up
      animationActiveRef.current = false
      setShowCharacter(false)

      // Clear timeouts
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current)
      }

      clearTimeout(initTimeout)

      if (easterEgg && typeof easterEgg.disable === "function") {
        easterEgg.disable()
      }


    }
  }, [addGestureToQueue, triggerEasterEgg])

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      {showCharacter && portalContainer && (
        <>

          {createPortal(
            <>
              {/* Character element */}
              <div
                className="konami-character"
                id="konami-character-container"
                style={{
                  position: "fixed",
                  zIndex: 999999,
                  top: "50%",
                  left: `${position}px`,
                  transform: `translateY(calc(-50% + ${verticalOffset}px))`,
                  pointerEvents: "none",
                  display: "block",
                  opacity: 1,
                  visibility: "visible",
                  width: "240px",
                  height: "240px",
                }}
              >
                <img
                  ref={imageRef}
                  src={`/easter-egg/images/${currentCharacter}.png`}
                  alt="Easter Egg Character"
                  style={{
                    position: "relative",
                    width: "240px",
                    height: "240px",
                    maxWidth: "240px",
                    maxHeight: "240px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 10px rgba(0,0,0,0.3))",
                    transform: direction === 1 ? "scaleX(-1)" : "scaleX(1)",
                    display: "block",
                    opacity: 1,
                    visibility: "visible",
                  }}
                  onError={(e) => {
                    // Try fallback image
                    e.target.src = fallbackImagePath
                  }}
                />
              </div>
            </>,
            portalContainer
          )}
        </>
      )}
    </>
  )
}

export default KonamiEasterEgg
