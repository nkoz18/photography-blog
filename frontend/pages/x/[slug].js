import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { getStrapiURL } from '../../lib/api';
import { getDeviceInfo } from '../../lib/deviceInfo';
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

// Thank you typing text component
const ThankYouTypingText = ({ startTyping, formData }) => {
  const [completedTexts, setCompletedTexts] = useState([]);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [typedElements, setTypedElements] = useState([]);
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Determine contact method based on hierarchy: phone > email > instagram
  const getContactMethod = () => {
    if (formData.phone) return "text you";
    if (formData.email) return "email you"; 
    if (formData.instagram) return "hit you up on IG";
    return "get in touch"; // fallback
  };

  const createStyledElements = (text) => {
    const elements = [];
    const targetText = '_passed_lives_';
    
    if (!text.includes(targetText)) {
      return text.split('').map((char, index) => ({ char, isHighlight: false, key: index }));
    }
    
    // Split text and apply yellow color to _passed_lives_
    const parts = text.split(targetText);
    let elementIndex = 0;
    
    // Before target text
    if (parts[0]) {
      parts[0].split('').forEach(char => {
        elements.push({ char, isHighlight: false, key: elementIndex++ });
      });
    }
    
    // Target text (yellow)
    targetText.split('').forEach(char => {
      elements.push({ char, isHighlight: true, key: elementIndex++ });
    });
    
    // After target text
    if (parts[1]) {
      parts[1].split('').forEach(char => {
        elements.push({ char, isHighlight: false, key: elementIndex++ });
      });
    }
    
    return elements;
  };

  const textSequence = [
    `I'll ${getContactMethod()} when your photos are ready.`,
    "Please follow me on Instagram at _passed_lives_ for more street photography!"
  ];

  useEffect(() => {
    if (!startTyping || currentTextIndex >= textSequence.length) return;

    const currentText = textSequence[currentTextIndex];
    const isLastText = currentTextIndex === textSequence.length - 1;
    
    const startDelay = currentTextIndex === 0 ? 1000 : 500; 
    
    const timer = setTimeout(() => {
      let charIndex = 0;
      setTypedElements([]);
      setIsTypingComplete(false);
      
      const styledElements = createStyledElements(currentText);
      
      const typingInterval = setInterval(() => {
        if (charIndex <= currentText.length) {
          setTypedElements(styledElements.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(typingInterval);
          setIsTypingComplete(true);
          
          if (isLastText) {
            // Final text stays
          } else {
            // Add to completed texts and move to next
            setTimeout(() => {
              setCompletedTexts(prev => [...prev, currentText]);
              setTypedElements([]);
              setCurrentTextIndex(prev => prev + 1);
            }, 800);
          }
        }
      }, 50);

      return () => clearInterval(typingInterval);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [currentTextIndex, startTyping]);

  return (
    <div>
      {/* Show completed texts */}
      {completedTexts.map((text, index) => (
        <div key={index} style={{ marginBottom: '0.5rem' }}>
          {text}
        </div>
      ))}
      
      {/* Show currently typing text */}
      {currentTextIndex < textSequence.length && (
        <div>
          {typedElements.map(element => (
            <span key={element.key} style={{ color: element.isHighlight ? '#FFE200' : 'inherit' }}>
              {element.char}
            </span>
          ))}
          {!isTypingComplete && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ marginLeft: '2px' }}
            >
              |
            </motion.span>
          )}
        </div>
      )}
    </div>
  );
};

// Error typing text component for validation messages
const ErrorTypingText = ({ text, startTyping }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    if (!startTyping || !text) return;

    // Reset when text changes
    setDisplayedText('');
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
    }, 50);

    return () => clearInterval(typingInterval);
  }, [text, startTyping]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ 
        fontSize: '0.9rem',
        lineHeight: '1.4',
        fontFamily: '"IBM Plex Mono", monospace',
        textAlign: 'center',
        color: '#ff6b6b'
      }}
    >
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
    </motion.div>
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
        fontSize: '0.9rem', // Smaller
        lineHeight: '1.5', 
        fontFamily: '"IBM Plex Mono", monospace',
        textAlign: 'left',
        minHeight: '6rem' // More space to prevent jumping when second sentence appears
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
              {element.char === '\n' ? <br /> : element.char}
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
  const router = useRouter();
  const { slug } = router.query;
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
  const thankYouButtonRef = useRef(null);
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showContactRequirement, setShowContactRequirement] = useState(false);
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    instagram: false
  });
  const [thankYouAnimationsComplete, setThankYouAnimationsComplete] = useState(false);
  const [randomWord, setRandomWord] = useState('');

  useEffect(() => {
    // For mobile compatibility, check if slug exists even if router.isReady is false
    if (slug && slug !== '') {
      fetchEncounter();
    }
  }, [slug]);
  
  // Initialize rough canvas elements (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && (step === 'form' || step === 'thank-you')) {
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
        
        // Draw rough thank you button
        if (thankYouButtonRef.current) {
          const canvas = thankYouButtonRef.current;
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
      }).catch(console.error);
    }
  }, [step]);
  
  // Pre-populate form fields from URL parameters
  useEffect(() => {
    if (slug) {
      const urlParams = new URLSearchParams(window.location.search);
      const preFilledData = {};
      
      
      // Get data from URL params
      if (urlParams.get('name')) {
        preFilledData.name = urlParams.get('name');
        // Extract first name for greeting
        const firstName = urlParams.get('name').split(' ')[0];
        setUserName(firstName);
      }
      if (urlParams.get('phone')) {
        preFilledData.phone = urlParams.get('phone');
      }
      if (urlParams.get('email')) {
        preFilledData.email = urlParams.get('email');
      }
      if (urlParams.get('instagram')) {
        preFilledData.instagram = urlParams.get('instagram');
      }
      
      // Also check encounter attributes if available
      if (encounter) {
        if (encounter.attributes.contactPhone && !preFilledData.phone) preFilledData.phone = encounter.attributes.contactPhone;
        if (encounter.attributes.contactEmail && !preFilledData.email) preFilledData.email = encounter.attributes.contactEmail;
        if (encounter.attributes.contactInstagram && !preFilledData.instagram) preFilledData.instagram = encounter.attributes.contactInstagram;
      }
      
      if (Object.keys(preFilledData).length > 0) {
        setFormData(prev => ({ ...prev, ...preFilledData }));
      }
    }
  }, [slug, encounter]);

  const fetchEncounter = async () => {
    try {
      const apiUrl = getStrapiURL();

      // Add cache-busting and optimize for speed
      const url = `${apiUrl}/api/photo-encounters?filters[slug]=${slug}&populate=*`;
      
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
      
      if (!response.ok) {
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

  const validateEmail = (email) => {
    if (!email) return true; // Empty is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInstagram = (handle) => {
    if (!handle) return true; // Empty is valid
    const instagramRegex = /^(?!.*\.\.)[a-zA-Z0-9._]{1,30}$/;
    return instagramRegex.test(handle);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate fields
    const newFieldErrors = {
      email: formData.email && !validateEmail(formData.email),
      instagram: formData.instagram && !validateInstagram(formData.instagram)
    };
    
    setFieldErrors(newFieldErrors);
    
    // Check if there are validation errors
    if (newFieldErrors.email || newFieldErrors.instagram) {
      return;
    }
    
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

      // Collect device and browser information
      const deviceInfo = getDeviceInfo();

      const response = await fetch(`${apiUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Format phone for E.164 if it's a US number without country code
          phone: formData.phone ? (formData.phone.startsWith('+') ? formData.phone : `+1${formData.phone.replace(/\D/g, '')}`) : null,
          encounterSlug: slug,
          // Add device information
          ...deviceInfo
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save contact information');
      }

      // Select random word for thank you page
      const coolWords = [
        'Perfect', 'Sweet', 'Dope', 'Far Out', 'Tubular', 'Psychedelic', 'Hell Ya', 'Sick', 'Rad', 'Fire', 
        'Lit', 'Stellar', 'Gucci', 'Epic', 'Killer', 'Bet', 'Slay', 'Iconic', 'Wicked', 'Tight', 'Ace', 
        'Fresh', 'Groovy', 'Vibe Check Passed', 'Legit', 'On Point', "Chef's Kiss", "Bussin'", 'Legendary', 
        "Vibin'", 'Fuego', 'Banger', 'Yasss', 'Mad Chill', 'Clean', 'Snatched', "Poppin'", 'Chillax', 'Golden'
      ];
      const selectedWord = coolWords[Math.floor(Math.random() * coolWords.length)];
      setRandomWord(selectedWord);
      setStep('thank-you');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInstagramDeepLink = () => {
    // Try to open Instagram app, fallback to web
    const appUrl = 'instagram://user?username=_passed_lives_';
    const webUrl = 'https://instagram.com/_passed_lives_';
    
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
      fontFamily: '"Kirang Haerang", cursive',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
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
            style={{ textAlign: 'center', marginBottom: '1rem' }}
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
                fontSize: '1.8rem', 
                marginBottom: '1rem', 
                color: '#ff007f',
                textShadow: '0 0 20px rgba(255, 0, 127, 0.3)',
                fontFamily: '"Kirang Haerang", cursive !important',
                textAlign: 'center',
                minHeight: '2.5rem', // Reserve space to prevent jumping
                marginTop: '0rem'
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
              style={{ marginBottom: '0.5rem' }}
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
              style={{ marginBottom: '1rem' }}
            >
              <input
                type="text"
                placeholder="👤 Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  border: '2px solid #333',
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333';
                  const firstName = e.target.value.trim().split(' ')[0];
                  setUserName(firstName);
                }}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              style={{ marginBottom: '1rem' }}
            >
              <input
                type="tel"
                placeholder="📱 Phone number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.9rem',
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
              style={{ marginBottom: '1rem' }}
            >
              <input
                type="email"
                placeholder="📧 Email address (optional)"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: false });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  border: `2px solid ${fieldErrors.email ? '#ff6b6b' : '#333'}`,
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = fieldErrors.email ? '#ff6b6b' : '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = fieldErrors.email ? '#ff6b6b' : '#333'}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              style={{ marginBottom: '1rem' }}
            >
              <input
                type="text"
                placeholder="📷 Instagram handle (optional)"
                value={formData.instagram}
                onChange={(e) => {
                  setFormData({ ...formData, instagram: e.target.value.replace('@', '') });
                  if (fieldErrors.instagram) {
                    setFieldErrors({ ...fieldErrors, instagram: false });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  border: `2px solid ${fieldErrors.instagram ? '#ff6b6b' : '#333'}`,
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  fontFamily: '"IBM Plex Mono", monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = fieldErrors.instagram ? '#ff6b6b' : '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = fieldErrors.instagram ? '#ff6b6b' : '#333'}
              />
            </motion.div>


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
            
            {/* Pre-allocated space for error message to prevent jumping */}
            <div style={{ 
              minHeight: '3rem', 
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center'
            }}>
              {(error || showContactRequirement) && (
                <ErrorTypingText 
                  text={error || 'Please provide at least one way to contact you'}
                  startTyping={true}
                />
              )}
            </div>
          </motion.form>
        </motion.div>
      )}

      {step === 'thank-you' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.6 }}
            style={{ fontSize: '4rem', marginBottom: '1rem' }}
          >
            🎉
          </motion.div>
          
          {/* Pre-allocated space for heading */}
          <div style={{ minHeight: '4rem', marginBottom: '1rem' }}>
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              onAnimationComplete={() => setThankYouAnimationsComplete(true)}
              style={{ 
                color: '#ff007f', 
                textShadow: '0 0 20px rgba(255, 0, 127, 0.3)',
                fontFamily: '"Kirang Haerang", cursive',
                fontSize: '3rem',
                margin: 0
              }}
            >
              <TypingHeading text={randomWord + '!'} startTyping={thankYouAnimationsComplete} />
            </motion.h2>
          </div>
          
          {/* Pre-allocated space for body text */}
          <div style={{ 
            minHeight: '9rem', 
            marginBottom: '1.5rem',
            fontSize: '0.95rem', 
            lineHeight: '1.4', 
            fontFamily: '"IBM Plex Mono", monospace',
            textAlign: 'left',
            padding: '0 0.5rem'
          }}>
            <ThankYouTypingText startTyping={thankYouAnimationsComplete} formData={formData} />
          </div>
          
          {/* Pre-allocated space for button */}
          <div style={{ minHeight: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 4, duration: 0.6 }}
              style={{ position: 'relative', width: '100%' }}
            >
              <canvas
                ref={thankYouButtonRef}
                width={400}
                height={60}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '60px',
                  pointerEvents: 'none'
                }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstagramDeepLink}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '60px',
                  fontSize: '1.5rem',
                  background: 'transparent',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 0,
                  padding: 0,
                  fontFamily: '"Kirang Haerang", cursive',
                  zIndex: 1
                }}
              >
                Follow me on Instagram
              </motion.button>
            </motion.div>
          </div>
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