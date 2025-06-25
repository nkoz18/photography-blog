import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { getStrapiURL } from '../../lib/api';
import Seo from '../../components/seo';

// Typing text component for heading
const TypingHeading = ({ text, startTyping }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!startTyping) return;

    const timer = setTimeout(() => {
      let currentIndex = 0;
      setShowCursor(true);
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setShowCursor(false);
        }
      }, 80); // Slightly slower for heading

      return () => clearInterval(typingInterval);
    }, 200); // Small delay before starting

    return () => clearTimeout(timer);
  }, [text, startTyping]);

  return (
    <>
      {displayedText}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{ marginLeft: '2px' }}
        >
          |
        </motion.span>
      )}
    </>
  );
};

// Sequential typing text component that stacks content
const SequentialTypingText = ({ texts, encounter, startTyping }) => {
  const [completedTexts, setCompletedTexts] = useState([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [typedElements, setTypedElements] = useState([]);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showBlinkingQuestion, setShowBlinkingQuestion] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Generate the text sequence based on encounter data
  const locationPart = encounter?.attributes?.placeName ? ` at ${encounter.attributes.placeName}` : '';
  const textSequence = [
    `I took some photos of you${locationPart}.`,
    "If they turn out good, I'd ❤️ to share them with you.",
    "How can I get in touch with you"
  ];

  // Function to create styled text elements with real-time coloring
  const createStyledElements = (text) => {
    const elements = [];
    const placeName = encounter?.attributes?.placeName;
    
    if (!placeName || !text.includes(placeName)) {
      // Replace "love" with heart emoji if present
      const heartText = text.replace(/\bl(?:o|ove?)\b/gi, '❤️');
      return heartText.split('').map((char, index) => ({ char, isLocation: false, key: index }));
    }
    
    const parts = text.split(placeName);
    let elementIndex = 0;
    
    // Before location name
    if (parts[0]) {
      const beforeText = parts[0].replace(/\bl(?:o|ove?)\b/gi, '❤️');
      beforeText.split('').forEach(char => {
        elements.push({ char, isLocation: false, key: elementIndex++ });
      });
    }
    
    // Location name (yellow)
    placeName.split('').forEach(char => {
      elements.push({ char, isLocation: true, key: elementIndex++ });
    });
    
    // After location name
    if (parts[1]) {
      const afterText = parts[1].replace(/\bl(?:o|ove?)\b/gi, '❤️');
      afterText.split('').forEach(char => {
        elements.push({ char, isLocation: false, key: elementIndex++ });
      });
    }
    
    return elements;
  };

  useEffect(() => {
    if (!startTyping || currentTextIndex >= textSequence.length) return;

    const currentText = textSequence[currentTextIndex];
    const isLastText = currentTextIndex === textSequence.length - 1;
    const isSecondText = currentTextIndex === 1;
    
    // Create styled elements for current text
    const styledElements = createStyledElements(currentText);
    
    // Start typing after a delay - wait for heading to finish first
    const startDelay = currentTextIndex === 0 ? 2000 : 1500; // First text waits for heading, others 1.5s
    
    const timer = setTimeout(() => {
      let currentIndex = 0;
      setTypedElements([]);
      setIsTypingComplete(false);
      setShowBlinkingQuestion(false);
      setShowCursor(true);
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= styledElements.length) {
          setTypedElements(styledElements.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTypingComplete(true);
          
          if (isLastText) {
            setShowCursor(false);
            setShowBlinkingQuestion(true);
          } else if (isSecondText) {
            // Second text gets replaced by third, don't add to completed array
            // Also clear the typing display to prevent duplication
            setTimeout(() => {
              setTypedElements([]); // Clear current typing display
              setCurrentTextIndex(prev => prev + 1);
            }, 2500); // Longer pause before replacing with third text
          } else {
            // First text stays, add to completed array
            setTimeout(() => {
              setCompletedTexts(prev => [...prev, { text: currentText, elements: styledElements }]);
              setTypedElements([]); // Clear current typing display
              setCurrentTextIndex(prev => prev + 1);
            }, 1000);
          }
        }
      }, 50);

      return () => clearInterval(typingInterval);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [currentTextIndex, encounter, startTyping]);

  // Function to render completed text with proper styling
  const renderCompletedText = (textData) => {
    return textData.elements.map(element => (
      <span 
        key={element.key}
        style={{ color: element.isLocation ? '#FFE200' : 'inherit' }}
      >
        {element.char}
      </span>
    ));
  };

  return (
    <motion.div 
      style={{ 
        fontSize: '1.1rem', // Slightly smaller
        lineHeight: '1.6', 
        fontFamily: '"IBM Plex Mono", monospace',
        textAlign: 'left',
        minHeight: '8rem' // Reserve more space to prevent jumping
      }}
    >
      {/* Show completed texts */}
      {completedTexts.map((textData, index) => (
        <div key={index} style={{ marginBottom: '0.5rem' }}>
          {renderCompletedText(textData)}
        </div>
      ))}
      
      {/* Show currently typing text */}
      {currentTextIndex < textSequence.length && (
        <div>
          {typedElements.map(element => (
            <span 
              key={element.key}
              style={{ color: element.isLocation ? '#FFE200' : 'inherit' }}
            >
              {element.char}
            </span>
          ))}
          {showCursor && !showBlinkingQuestion && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ marginLeft: '2px' }}
            >
              |
            </motion.span>
          )}
          {showBlinkingQuestion && isTypingComplete && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ marginLeft: '2px' }}
            >
              ?
            </motion.span>
          )}
        </div>
      )}
    </motion.div>
  );
};

const EncounterPage = () => {
  console.log('🔍 [Component Debug] EncounterPage rendering');
  
  const router = useRouter();
  const { slug } = router.query;
  
  console.log('🔍 [Component Debug] Router state:', {
    isReady: router.isReady,
    query: router.query,
    slug: slug
  });
  const [step, setStep] = useState('loading');
  const [encounter, setEncounter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    instagram: '',
    tiktok: '',
    facebook: '',
    youtube: '',
    whatsapp: '',
    snapchat: ''
  });
  const submitButtonRef = useRef(null);
  const photoContainerRef = useRef(null);
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showContactRequirement, setShowContactRequirement] = useState(false);
  const [animationsComplete, setAnimationsComplete] = useState(false);

  useEffect(() => {
    console.log('🔍 [Router Debug] useEffect triggered');
    console.log('🔍 [Router Debug] router.isReady:', router.isReady);
    console.log('🔍 [Router Debug] slug:', slug);
    console.log('🔍 [Router Debug] router.query:', router.query);
    
    if (slug) {
      console.log('🔍 [Router Debug] Slug available, calling fetchEncounter');
      fetchEncounter();
    } else {
      console.log('🔍 [Router Debug] No slug available yet');
    }
  }, [slug]);
  
  // Initialize rough canvas elements (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && step === 'form') {
      import('roughjs/bundled/rough.esm').then((roughModule) => {
        const rough = roughModule.default;
        
        // Draw rough submit button
        if (submitButtonRef.current) {
          const canvas = submitButtonRef.current;
          const rc = rough.canvas(canvas);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          rc.rectangle(10, 10, canvas.width - 20, canvas.height - 20, {
            fill: '#ff007f',
            fillStyle: 'solid',
            stroke: '#ff007f',
            strokeWidth: 3,
            roughness: 1.5,
            bowing: 2
          });
        }
        
        // Draw rough photo container
        if (photoContainerRef.current) {
          const canvas = photoContainerRef.current;
          const rc = rough.canvas(canvas);
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          rc.circle(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) - 20, {
            stroke: '#ff007f',
            strokeWidth: 4,
            roughness: 2,
            bowing: 3
          });
        }
      }).catch(console.error);
    }
  }, [step]);
  
  // Pre-populate form fields from URL parameters
  useEffect(() => {
    if (slug) {
      const urlParams = new URLSearchParams(window.location.search);
      const preFilledData = {};
      
      console.log('🔍 [URL Debug] Full URL:', window.location.href);
      console.log('🔍 [URL Debug] Search params:', window.location.search);
      console.log('🔍 [URL Debug] URLSearchParams entries:', [...urlParams.entries()]);
      
      // Get data from URL params
      if (urlParams.get('name')) {
        preFilledData.name = urlParams.get('name');
        // Extract first name for greeting
        const firstName = urlParams.get('name').split(' ')[0];
        setUserName(firstName);
        console.log('🔍 [URL Debug] Found name:', urlParams.get('name'), 'First name:', firstName);
      }
      if (urlParams.get('phone')) {
        preFilledData.phone = urlParams.get('phone');
        console.log('🔍 [URL Debug] Found phone:', urlParams.get('phone'));
      }
      if (urlParams.get('email')) {
        preFilledData.email = urlParams.get('email');
        console.log('🔍 [URL Debug] Found email:', urlParams.get('email'));
      }
      if (urlParams.get('instagram')) {
        preFilledData.instagram = urlParams.get('instagram');
        console.log('🔍 [URL Debug] Found instagram:', urlParams.get('instagram'));
      }
      
      // Also check encounter attributes if available
      if (encounter) {
        console.log('🔍 [URL Debug] Encounter attributes:', encounter.attributes);
        if (encounter.attributes.contactPhone && !preFilledData.phone) preFilledData.phone = encounter.attributes.contactPhone;
        if (encounter.attributes.contactEmail && !preFilledData.email) preFilledData.email = encounter.attributes.contactEmail;
        if (encounter.attributes.contactInstagram && !preFilledData.instagram) preFilledData.instagram = encounter.attributes.contactInstagram;
      }
      
      console.log('🔍 [URL Debug] Final preFilledData:', preFilledData);
      
      if (Object.keys(preFilledData).length > 0) {
        setFormData(prev => ({ ...prev, ...preFilledData }));
        console.log('🔍 [URL Debug] Updated form data');
      }
    }
  }, [slug, encounter]);

  const fetchEncounter = async () => {
    try {
      console.log('🔍 [Fetch Debug] Starting fetchEncounter with slug:', slug);
      
      const apiUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
        ? 'http://localhost:1337'
        : getStrapiURL();

      // Add cache-busting and optimize for speed
      const url = `${apiUrl}/api/photo-encounters?filters[slug]=${slug}&populate=*`;
      console.log('🔍 [Fetch Debug] API URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          // Force fresh data from Strapi - bypass any intermediate caches
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        // Add timestamp to URL to bypass CDN cache
        cache: 'no-store'
      });
      
      console.log('🔍 [Fetch Debug] Response status:', response.status);
      console.log('🔍 [Fetch Debug] Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🔍 [Fetch Debug] Error response:', errorText);
        throw new Error(`Encounter not found (${response.status})`);
      }

      const data = await response.json();
      console.log('🔍 [Fetch Debug] Response data:', data);
      
      if (!data.data || data.data.length === 0) {
        console.log('🔍 [Fetch Debug] No encounter data found');
        throw new Error('Encounter not found');
      }

      console.log('🔍 [Fetch Debug] Found encounter:', data.data[0]);
      setEncounter(data.data[0]);
      setStep('form');
    } catch (err) {
      console.error('🔍 [Fetch Debug] Error:', err);
      setError(err.message);
      setStep('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one contact method
    if (!formData.phone && !formData.email && !formData.instagram) {
      setError('Please provide at least one way to contact you');
      setShowContactRequirement(true);
      return;
    }

    setSubmitting(true);
    setError('');
    setShowContactRequirement(false);

    try {
      const apiUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
        ? 'http://localhost:1337'
        : getStrapiURL();

      const response = await fetch(`${apiUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          encounterSlug: slug
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save contact information');
      }

      setStep('thank-you');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInstagramDeepLink = () => {
    // Try to open Instagram app, fallback to web
    const appUrl = 'instagram://user?username=silkytruth';
    const webUrl = 'https://instagram.com/silkytruth';
    
    window.location.href = appUrl;
    
    // Fallback to web after a short delay
    setTimeout(() => {
      window.open(webUrl, '_blank');
    }, 1000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Kirang Haerang", cursive'
    }}>
      <Seo 
        seo={{
          metaTitle: "Street Photography - Silky Truth",
          metaDescription: "Share your contact info to receive your street photography photos",
          metaRobots: "noindex, nofollow"
        }}
      />

      {step === 'loading' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
          >
            📸
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ color: '#ff007f', fontFamily: '"Kirang Haerang", cursive' }}
          >
            Loading...
          </motion.h2>
        </motion.div>
      )}

      {step === 'form' && encounter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ maxWidth: '400px', width: '100%' }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, duration: 0.8, type: "spring", bounce: 0.4 }}
              style={{ marginBottom: '1rem', position: 'relative', width: '140px', height: '140px', margin: '0 auto 1rem auto' }}
            >
              <canvas
                ref={photoContainerRef}
                width={140}
                height={140}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '140px',
                  height: '140px'
                }}
              />
              <img 
                src="/images/nikita.jpg" 
                alt="Nikita - Street Photographer"
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 0 20px rgba(255, 0, 127, 0.3)'
                }}
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              style={{ 
                fontSize: '2rem', 
                marginBottom: '2rem', 
                color: '#ff007f',
                textShadow: '0 0 20px rgba(255, 0, 127, 0.3)',
                fontFamily: '"Kirang Haerang", cursive !important',
                textAlign: 'center',
                minHeight: '3rem' // Reserve space to prevent jumping
              }}
            >
              <TypingHeading 
                text={userName ? `Hey ${userName}, I'm Nikita!` : "Hey there! I'm Nikita!"}
                startTyping={animationsComplete}
              />
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              onAnimationComplete={() => setAnimationsComplete(true)}
            >
              <SequentialTypingText encounter={encounter} startTyping={animationsComplete} />
            </motion.div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            onSubmit={handleSubmit}
            style={{ marginBottom: '2rem' }}
          >
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <input
                type="tel"
                placeholder="📱 Phone number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  border: '2px solid #333',
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <input
                type="email"
                placeholder="📧 Email address (optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  border: '2px solid #333',
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              style={{ marginBottom: '1.5rem' }}
            >
              <input
                type="text"
                placeholder="📷 Instagram handle (optional)"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  border: '2px solid #333',
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{ 
                  color: '#ff6b6b', 
                  marginBottom: '1rem', 
                  padding: '0.5rem',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
              >
                {error}
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ position: 'relative', width: '100%' }}
            >
              <canvas
                ref={submitButtonRef}
                width={400}
                height={60}
                style={{
                  width: '100%',
                  height: '60px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
                onClick={!submitting ? handleSubmit : undefined}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#fff',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  fontFamily: '"Kirang Haerang", cursive',
                  pointerEvents: 'none',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </div>
            </motion.div>
          </motion.form>

          {showContactRequirement && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ 
                textAlign: 'center', 
                fontSize: '0.9rem', 
                color: '#ccc',
                fontFamily: '"Kirang Haerang", cursive'
              }}
            >
              At least one contact method required
            </motion.div>
          )}
        </motion.div>
      )}

      {step === 'thank-you' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: '400px' }}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.6 }}
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
          >
            🎉
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ 
              color: '#ff007f', 
              marginBottom: '1rem',
              textShadow: '0 0 20px rgba(255, 0, 127, 0.3)',
              fontFamily: '"Kirang Haerang", cursive'
            }}
          >
            Perfect!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              marginBottom: '2rem',
              opacity: 0.9,
              fontFamily: '"Kirang Haerang", cursive'
            }}
          >
            I&apos;ll text you when your photos are ready. Feel free to follow me on Instagram for more street photography!
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstagramDeepLink}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              color: '#fff',
              border: 'none',
              borderRadius: '0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              fontFamily: '"Kirang Haerang", cursive'
            }}
          >
            📷 Follow @silkytruth
          </motion.button>
        </motion.div>
      )}

      {step === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: '400px' }}
        >
          <motion.div 
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
          >
            😔
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ 
              color: '#ff6b6b', 
              marginBottom: '1rem',
              fontFamily: '"Kirang Haerang", cursive'
            }}
          >
            Oops!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.6', 
              opacity: 0.9,
              fontFamily: '"Kirang Haerang", cursive'
            }}
          >
            {error}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
};

// AWS Amplify Static Export Strategy:
// No getStaticPaths/getStaticProps - pure client-side for instant updates
// This ensures NEW encounters work immediately without CDN cache delays

export default EncounterPage;