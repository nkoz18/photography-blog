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
        `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'https://api.silkytruth.com'}/api/upload/report-photo/${imageId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000001,
            padding: "20px",
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            <AnimatePresence mode="wait">
              {submitStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  key="success"
                >
                  <div style={{ color: "#059669", marginBottom: "16px", fontSize: "48px" }}>✓</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#059669" }}>Report Submitted</h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Thank you for your feedback
                  </p>
                </motion.div>
              )}

              {submitStatus === "already-reported" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  key="already-reported"
                >
                  <div style={{ color: "#d97706", marginBottom: "16px", fontSize: "48px" }}>⚠</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#d97706" }}>Already Reported</h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    This image has already been reported
                  </p>
                </motion.div>
              )}

              {submitStatus === "rate-limited" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  key="rate-limited"
                >
                  <div style={{ color: "#dc2626", marginBottom: "16px", fontSize: "48px" }}>⏰</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#dc2626" }}>Too Many Reports</h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Please try again later
                  </p>
                </motion.div>
              )}

              {submitStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  key="error"
                >
                  <div style={{ color: "#dc2626", marginBottom: "16px", fontSize: "48px" }}>✗</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "#dc2626" }}>Error</h3>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Please try again
                  </p>
                </motion.div>
              )}

              {!submitStatus && step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="step1"
                >
                  <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "600" }}>
                    Are you in this photo?
                  </h3>
                  
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStep1Submit("yes")}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: "pointer",
                        minWidth: "80px",
                      }}
                    >
                      Yes
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStep1Submit("no")}
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: "pointer",
                        minWidth: "80px",
                      }}
                    >
                      No
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {!submitStatus && step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key="step2"
                >
                  <h3 style={{ margin: "0 0 24px 0", fontSize: "20px", fontWeight: "600" }}>
                    Why are you reporting it?
                  </h3>
                  
                  {isSubmitting ? (
                    <div style={{ padding: "40px 0" }}>
                      <div style={{ 
                        width: "32px", 
                        height: "32px", 
                        border: "3px solid #f3f3f3",
                        borderTop: "3px solid #ff007f",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto"
                      }} />
                      <p style={{ marginTop: "16px", color: "#666" }}>Submitting...</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {reasonOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.02, backgroundColor: "#f9fafb" }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStep2Submit(option.value)}
                          style={{
                            padding: "16px 20px",
                            backgroundColor: "white",
                            color: "#374151",
                            border: "2px solid #e5e7eb",
                            borderRadius: "8px",
                            fontSize: "16px",
                            fontWeight: "500",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ReportModal