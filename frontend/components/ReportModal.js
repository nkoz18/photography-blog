import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const ReportModal = ({ isOpen, imageId, imageName, onClose }) => {
  const [step, setStep] = useState(1) // 1: Are you in this photo?, 2: Why are you reporting?
  const [isInPhoto, setIsInPhoto] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const reasonOptions = [
    { value: "unflattering", label: "Unflattering" },
    { value: "inappropriate", label: "Inappropriate" },
    { value: "copyright", label: "Copyright" },
    { value: "other", label: "Other" },
  ]

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
          {/* Background container that matches modal content */}
          <motion.div
            className="report-modal-container"
            initial={{ scale: 0.7, y: 80, rotateX: 15 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.7, y: 80, rotateX: -15, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 20, 
              stiffness: 280,
              opacity: { duration: 0.2 }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated background box */}
            <AnimatePresence mode="wait">
              <motion.div
                className="report-modal-background"
                key={`box-${step}-${submitStatus || 'default'}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            </AnimatePresence>
            
            {/* Close button - positioned to stay inside the doodle box */}
            <motion.button
              className="report-modal-close-button"
              onClick={handleClose}
              whileHover={{ 
                x: [0, -1, 1, -1, 1, 0],
                transition: { duration: 0.25, repeat: Infinity }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 150 150"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M 22.93 29.22 C 23.98 28.37 25.03 27.53 26.09 26.68 C 29.30 28.39 32.51 30.12 35.70 31.87 C 36.11 30.15 36.54 28.43 36.98 26.72 C 50.58 34.90 62.51 45.41 74.71 55.48 C 86.28 44.84 98.53 34.78 112.04 26.69 C 112.47 28.41 112.88 30.13 113.29 31.86 C 116.79 29.95 120.33 28.10 123.88 26.28 C 124.88 29.04 125.49 31.91 125.86 34.82 C 127.39 34.19 128.93 33.56 130.47 32.95 C 128.60 37.54 127.03 42.71 122.73 45.68 C 112.04 54.18 100.56 61.68 90.46 70.92 C 100.10 81.88 110.07 92.70 117.94 105.05 C 121.58 108.99 120.06 114.35 119.51 119.06 C 115.20 117.86 111.22 121.53 107.35 121.32 C 96.12 109.52 86.38 96.27 74.28 85.26 C 64.60 95.27 54.88 105.31 46.43 116.41 C 44.84 118.25 43.44 120.60 41.06 121.53 C 37.25 120.47 33.63 118.65 29.49 119.06 C 28.94 114.35 27.42 109.00 31.05 105.05 C 38.84 92.63 49.11 82.06 58.59 70.96 C 48.43 61.77 36.96 54.21 26.28 45.66 C 22.06 42.73 20.46 37.67 18.49 33.19 C 20.28 33.81 22.06 34.44 23.85 35.06 C 23.53 33.11 23.22 31.17 22.93 29.22 Z" />
              </svg>
            </motion.button>

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
                      <motion.button
                        className="report-modal-step1-button yes"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStep1Submit("yes")}
                      >
                        Yes
                      </motion.button>
                      
                      <motion.button
                        className="report-modal-step1-button no"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStep1Submit("no")}
                      >
                        No
                      </motion.button>
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
                          <motion.button
                            className="report-modal-option-button"
                            key={option.value}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + (index * 0.1) }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStep2Submit(option.value)}
                          >
                            {option.label}
                          </motion.button>
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