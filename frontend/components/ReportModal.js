import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import RoughCanvas from "./RoughCanvas"
import { isImageReported, markImageAsReported } from "../lib/reportStorage"

const ReportModal = ({ isOpen, imageId, imageName, onClose }) => {
  const [step, setStep] = useState(1) // 1: Are you in this photo?, 2: Why are you reporting?
  const [isInPhoto, setIsInPhoto] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const [alreadyReported, setAlreadyReported] = useState(false)

  const reasonOptions = [
    { value: "unflattering", label: "Unflattering" },
    { value: "inappropriate", label: "Inappropriate" },
    { value: "copyright", label: "Copyright" },
    { value: "other", label: "Other" },
  ]

  // Check if image was already reported when modal opens
  useEffect(() => {
    if (isOpen && imageId) {
      const wasReported = isImageReported(imageId)
      setAlreadyReported(wasReported)
      if (wasReported) {
        setSubmitStatus("session-already-reported")
      }
    }
  }, [isOpen, imageId])

  const handleStep1Submit = (answer) => {
    setIsInPhoto(answer)
    setStep(2)
  }

  const handleStep2Submit = async (selectedReason) => {
    setReason(selectedReason)
    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'https://api.silkytruth.com'}/api/report-image/${imageId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportedImageId: imageId,
            reason: selectedReason,
            isSubjectInImage: isInPhoto,
          }),
        }
      )

      if (response.ok) {
        // Mark image as reported in session storage
        markImageAsReported(imageId)
        setSubmitStatus("success")
        setTimeout(() => {
          onClose()
          resetForm()
        }, 2000)
      } else if (response.status === 400) {
        const data = await response.json()
        if (data.message && data.message.includes("already been reported")) {
          setSubmitStatus("already-reported")
        } else {
          setSubmitStatus("error")
        }
      } else if (response.status === 429) {
        setSubmitStatus("rate-limited")
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setIsInPhoto("")
    setReason("")
    setSubmitStatus(null)
    setAlreadyReported(false)
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="report-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          {/* Background container with rough.js canvas */}
          <motion.div
            className="report-modal-container"
            initial={{ 
              scale: 0.7, 
              y: 80, 
              rotateX: 15,
              x: [0, -2, 2, -1, 1, 0] // Add jittery entrance
            }}
            animate={{ 
              scale: 1, 
              y: 0, 
              rotateX: 0,
              x: 0
            }}
            exit={{ 
              scale: 0.7, 
              y: 80, 
              rotateX: -15, 
              opacity: 0,
              x: [0, 1, -1, 2, -2, 0] // Add jittery exit
            }}
            transition={{ 
              type: "spring", 
              damping: 15, // Reduced damping for more jitter
              stiffness: 350, // Higher stiffness for snappier movement
              opacity: { duration: 0.2 },
              x: { duration: 0.4, ease: "easeInOut" }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rough.js animated background box */}
            <AnimatePresence mode="wait">
              <motion.div
                className="report-modal-rough-background"
                key={`rough-box-${step}-${submitStatus || 'default'}`}
                initial={{ 
                  scale: 0.8, 
                  opacity: 0,
                  rotate: [0, -1, 1, -0.5, 0.5, 0] // Jittery entrance rotation
                }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  rotate: 0
                }}
                exit={{ 
                  scale: 0.8, 
                  opacity: 0,
                  rotate: [0, 0.5, -0.5, 1, -1, 0] // Jittery exit rotation
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 20,
                  rotate: { duration: 0.3, ease: "easeInOut" }
                }}
              >
                <RoughCanvas 
                  width={480} 
                  height={480} 
                  mode="main" 
                  roughness={1.5}
                  className="modal-background-canvas"
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Close button using rough.js */}
            <motion.div
              className="report-modal-close-button"
              onClick={handleClose}
              whileHover={{ 
                scale: [1, 1.1, 1],
                x: [0, -1, 1, -1, 1, 0],
                transition: { duration: 0.3, repeat: Infinity }
              }}
              whileTap={{ scale: 0.9 }}
              style={{ cursor: 'pointer' }}
            >
              <RoughCanvas 
                width={36} 
                height={36} 
                mode="close-button" 
                roughness={2.8}
                className="close-button-canvas"
              />
              <div 
                className="close-button-x"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#ff007f',
                  fontFamily: 'Barriecito, cursive',
                  pointerEvents: 'none',
                  userSelect: 'none'
                }}
              >
                ✕
              </div>
            </motion.div>

            {/* Content area - properly contained within the doodle box */}
            <div className="report-modal-content">
              <AnimatePresence mode="wait">
                {submitStatus === "success" && (
                  <motion.div
                    className="report-modal-success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="success"
                  >
                    <motion.div 
                      className="status-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                    >
                      ✓
                    </motion.div>
                    <h3 className="report-modal-title">
                      Report Submitted
                    </h3>
                    <p>
                      Thank you for your feedback
                    </p>
                  </motion.div>
                )}

                {submitStatus === "already-reported" && (
                  <motion.div
                    className="report-modal-already-reported"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="already-reported"
                  >
                    <motion.div 
                      className="status-icon"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                    >
                      ⚠
                    </motion.div>
                    <h3>
                      Already Reported
                    </h3>
                    <p>
                      This image has already been reported
                    </p>
                  </motion.div>
                )}

                {submitStatus === "session-already-reported" && (
                  <motion.div
                    className="report-modal-session-reported"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="session-already-reported"
                  >
                    <motion.div 
                      className="status-icon sleepy-cat-icon"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                      style={{ position: 'relative' }}
                    >
                      <img 
                        src="/images/sleepy_cat.gif" 
                        alt="Sleepy cat" 
                        style={{
                          width: '250px',
                          height: '130px',
                          objectFit: 'contain'
                        }}
                      />
                      {/* Floating Z's - positioned on left side */}
                      <motion.div
                        className="floating-z"
                        initial={{ opacity: 0, y: 0, x: -30 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0],
                          y: [-10, -30, -40, -50],
                          x: [-30, -35, -32, -38]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                          ease: "easeInOut"
                        }}
                        style={{
                          position: 'absolute',
                          top: '20px',
                          left: '10px',
                          fontSize: '24px',
                          color: 'white',
                          fontFamily: 'Barriecito, cursive',
                          fontWeight: 'bold'
                        }}
                      >
                        Z
                      </motion.div>
                      <motion.div
                        className="floating-z"
                        initial={{ opacity: 0, y: 0, x: -20 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0],
                          y: [-5, -25, -35, -45],
                          x: [-20, -18, -22, -16]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                          delay: 1,
                          ease: "easeInOut"
                        }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '40px',
                          fontSize: '18px',
                          color: 'white',
                          fontFamily: 'Barriecito, cursive',
                          fontWeight: 'bold'
                        }}
                      >
                        z
                      </motion.div>
                      <motion.div
                        className="floating-z"
                        initial={{ opacity: 0, y: 0, x: -15 }}
                        animate={{ 
                          opacity: [0, 1, 1, 0],
                          y: [-15, -35, -45, -55],
                          x: [-15, -18, -12, -16]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                          delay: 2,
                          ease: "easeInOut"
                        }}
                        style={{
                          position: 'absolute',
                          top: '30px',
                          left: '25px',
                          fontSize: '30px',
                          color: 'white',
                          fontFamily: 'Barriecito, cursive',
                          fontWeight: 'bold'
                        }}
                      >
                        Z
                      </motion.div>
                    </motion.div>
                    <h3>
                      Thanks!
                    </h3>
                    <p>
                      You already submitted a report for this image. We'll make sure to take a look at it and take it down if appropriate.
                    </p>
                  </motion.div>
                )}

                {submitStatus === "rate-limited" && (
                  <motion.div
                    className="report-modal-rate-limited"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="rate-limited"
                  >
                    <motion.div 
                      className="status-icon"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                    >
                      ⏰
                    </motion.div>
                    <h3>
                      Too Many Reports
                    </h3>
                    <p>
                      Please try again later
                    </p>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    className="report-modal-error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="error"
                  >
                    <motion.div 
                      className="status-icon"
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                    >
                      ✗
                    </motion.div>
                    <h3>
                      Error
                    </h3>
                    <p>
                      Please try again
                    </p>
                  </motion.div>
                )}

                {!submitStatus && step === 1 && (
                  <motion.div
                    className="report-modal-step1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="step1"
                  >
                    <h3 className="report-modal-question">
                      Are you in this photo?
                    </h3>
                    
                    <div className="report-modal-step1-buttons">
                      <motion.div
                        initial={{ 
                          opacity: 0, 
                          y: 20,
                          x: [0, -1, 1, 0] // Jittery entrance
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          x: 0
                        }}
                        transition={{ 
                          delay: 0.2,
                          x: { duration: 0.2, ease: "easeInOut" }
                        }}
                      >
                        <RoughCanvas
                          width={140}
                          height={60}
                          mode="yes-button"
                          text="Yes"
                          roughness={2.5}
                          onClick={() => handleStep1Submit("yes")}
                          className="step1-yes-button"
                        />
                      </motion.div>
                      
                      <motion.div
                        initial={{ 
                          opacity: 0, 
                          y: 20,
                          x: [0, 1, -1, 0] // Jittery entrance (opposite direction)
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          x: 0
                        }}
                        transition={{ 
                          delay: 0.3,
                          x: { duration: 0.2, ease: "easeInOut" }
                        }}
                      >
                        <RoughCanvas
                          width={140}
                          height={60}
                          mode="no-button"
                          text="No"
                          roughness={2.5}
                          onClick={() => handleStep1Submit("no")}
                          className="step1-no-button"
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {!submitStatus && step === 2 && (
                  <motion.div
                    className="report-modal-step2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    key="step2"
                  >
                    <h3 className="report-modal-question">
                      Why are you reporting it?
                    </h3>
                    
                    {isSubmitting ? (
                      <motion.div 
                        className="report-modal-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div 
                          className="report-modal-spinner"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p>
                          Submitting...
                        </p>
                      </motion.div>
                    ) : (
                      <div className="report-modal-options">
                        {reasonOptions.map((option, index) => (
                          <motion.div
                            key={option.value}
                            initial={{ 
                              opacity: 0, 
                              y: 20,
                              x: [0, index % 2 === 0 ? -1 : 1, 0] // Alternate jittery directions
                            }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              x: 0
                            }}
                            transition={{ 
                              delay: 0.1 + (index * 0.1),
                              x: { duration: 0.2, ease: "easeInOut" }
                            }}
                            className="report-modal-option-wrapper"
                          >
                            <RoughCanvas
                              width={280}
                              height={50}
                              mode="option-button"
                              text={option.label}
                              roughness={2.5}
                              onClick={() => handleStep2Submit(option.value)}
                              className="step2-option-button"
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReportModal