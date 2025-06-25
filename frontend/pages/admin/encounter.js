import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { getStrapiURL } from '../../lib/api';
import RoughCanvas from '../../components/RoughCanvas';
import TextInputWithPredictions from '../../components/TextInputWithPredictions';

const EncounterCreator = () => {
  const [step, setStep] = useState('create'); // 'create', 'loading', 'qr'
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  
  // Form fields for optional pre-fill
  const [formData, setFormData] = useState({
    customAddress: '',
    name: '',
    email: '',
    instagram: '',
    phone: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [resolvedAddress, setResolvedAddress] = useState(null);
  
  const inputRef = useRef(null);

  // Auto-save form data to localStorage to prevent data loss
  useEffect(() => {
    const savedData = localStorage.getItem('encounterFormData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
      } catch (e) {
        console.warn('Failed to restore form data:', e);
      }
    }
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    localStorage.setItem('encounterFormData', JSON.stringify(formData));
  }, [formData]);


  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setStep('loading');
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Validate form before proceeding
        if (!validateForm()) {
          setStep('create');
          setError('Please fix validation errors before creating encounter');
          return;
        }
        
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });

        try {
          const apiUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
            ? 'http://localhost:1337'
            : getStrapiURL();

          // Use resolved address if available, otherwise use manual address or coordinates
          let requestBody;
          if (resolvedAddress) {
            requestBody = {
              lat: resolvedAddress.lat,
              lng: resolvedAddress.lng,
              manualAddress: resolvedAddress.formatted_address,
              placeName: resolvedAddress.name,
              placeData: resolvedAddress.placeData,
              contactData: {
                name: formData.name || null,
                email: formData.email || null,
                instagram: formData.instagram || null,
                phone: formData.phone ? formData.phone.replace(/[^0-9+]/g, '') : null
              }
            };
          } else {
            requestBody = {
              lat: latitude,
              lng: longitude,
              manualAddress: formData.customAddress || null,
              contactData: {
                name: formData.name || null,
                email: formData.email || null,
                instagram: formData.instagram || null,
                phone: formData.phone ? formData.phone.replace(/[^0-9+]/g, '') : null
              }
            };
          }

          const response = await fetch(`${apiUrl}/api/photo-encounters/coords`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setSlug(data.slug);
          setAddress(data.address);
          setPlaceName(data.placeName);
          setStep('qr');
          
          // Clear saved form data after successful submission
          localStorage.removeItem('encounterFormData');
        } catch (err) {
          setError(`Failed to create encounter: ${err.message}`);
          setStep('create');
        }
      },
      (error) => {
        setError(`Location error: ${error.message}`);
        setStep('create');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const resetFlow = () => {
    setStep('create');
    setLocation(null);
    setAddress('');
    setPlaceName('');
    setSlug('');
    setError('');
    setFormData({
      customAddress: '',
      name: '',
      email: '',
      instagram: '',
      phone: ''
    });
    setValidationErrors({});
    setResolvedAddress(null);
    
    // Clear saved form data when creating another encounter
    localStorage.removeItem('encounterFormData');
  };

  const handleInputChange = (field, value) => {
    // Phone number: only allow numbers, spaces, hyphens, parentheses, and plus
    if (field === 'phone') {
      value = value.replace(/[^0-9\s\-\(\)\+]/g, '');
      
      // Enforce maximum length (15 digits max based on E.164 international format)
      const cleanPhone = value.replace(/[^0-9]/g, '');
      if (cleanPhone.length > 15) {
        // Truncate to keep only the first 15 digits while preserving formatting
        const truncatedDigits = cleanPhone.substring(0, 15);
        let formattedValue = '';
        let digitIndex = 0;
        
        // Rebuild the formatted string with only the allowed digits
        for (let i = 0; i < value.length && digitIndex < truncatedDigits.length; i++) {
          const char = value[i];
          if (/[0-9]/.test(char)) {
            formattedValue += truncatedDigits[digitIndex];
            digitIndex++;
          } else {
            formattedValue += char;
          }
        }
        value = formattedValue;
      }
    }
    
    // Instagram: remove @ if user types it at the beginning
    if (field === 'instagram' && value.startsWith('@')) {
      value = value.substring(1);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Helper function to check if Instagram handle is valid for link button
  const isValidInstagramHandle = (handle) => {
    if (!handle) return false;
    const instagramRegex = /^(?!.*\.\.)(?!.*\.$)[^\.][a-zA-Z0-9._]{0,29}$/;
    return instagramRegex.test(handle);
  };

  const validateField = (field, value) => {
    if (!value) return null; // All fields are optional
    
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Please enter a valid email address';
        
      case 'phone':
        // Remove all non-numeric characters for validation
        const cleanPhone = value.replace(/[^0-9]/g, '');
        console.log(`🔍 [Phone Validation] Original: "${value}", Clean: "${cleanPhone}", Length: ${cleanPhone.length}`);
        
        if (cleanPhone.length < 10) {
          console.log(`🔍 [Phone Validation] Too short: ${cleanPhone.length} < 10`);
          return 'Phone number must have at least 10 digits';
        }
        if (cleanPhone.length > 15) {
          console.log(`🔍 [Phone Validation] Too long: ${cleanPhone.length} > 15`);
          return 'Phone number is too long';
        }
        console.log(`🔍 [Phone Validation] Valid phone number`);
        return null;
        
      case 'instagram':
        // Instagram username validation regex from user's requirements
        const instagramRegex = /^(?!.*\.\.)(?!.*\.$)[^\.][a-zA-Z0-9._]{0,29}$/;
        if (!instagramRegex.test(value)) {
          return 'Invalid Instagram handle format (letters, numbers, periods, underscores only, 1-30 chars)';
        }
        return null;
        
      default:
        return null;
    }
  };

  const handleFieldBlur = (field) => {
    const value = formData[field];
    console.log(`🔍 [Field Blur] Field: "${field}", Value: "${value}"`);
    
    const error = validateField(field, value);
    console.log(`🔍 [Field Blur] Validation result for "${field}": ${error || 'No error'}`);
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };
  
  const validateForm = () => {
    const errors = {};
    
    // Validate all fields that have values
    Object.keys(formData).forEach(field => {
      if (formData[field] && ['email', 'phone', 'instagram'].includes(field)) {
        const error = validateField(field, formData[field]);
        if (error) {
          errors[field] = error;
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const baseUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
    ? `http://localhost:3000/x/${slug}`
    : `https://silkytruth.com/x/${slug}`;
  
  // Add URL parameters for form pre-population
  const urlParams = new URLSearchParams();
  if (formData.name && formData.name.trim()) urlParams.append('name', formData.name.trim());
  if (formData.email && formData.email.trim()) urlParams.append('email', formData.email.trim());
  if (formData.instagram && formData.instagram.trim()) urlParams.append('instagram', formData.instagram.trim());
  if (formData.phone && formData.phone.trim()) urlParams.append('phone', formData.phone.trim());
  
  const qrUrl = urlParams.toString() ? `${baseUrl}?${urlParams.toString()}` : baseUrl;

  return (
    <div style={{ 
      height: '100vh', 
      background: '#000', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"IBM Plex Mono", monospace',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {step === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: '400px' }}
        >
          <div style={{ marginBottom: '1rem', width: '100%' }}>
            <p style={{ color: '#ccc', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Fill out any details you want to pre-populate (all optional):
            </p>
            
            {/* Address Field with Autocomplete */}
            <div style={{ marginBottom: '1rem' }}>
              <TextInputWithPredictions
                value={formData.customAddress}
                onChange={(value) => handleInputChange('customAddress', value)}
                onResolvedAddressChange={setResolvedAddress}
                placeholder="Address or location (e.g., 'Powell's Books', '123 Main St')"
              />
            </div>

            {/* Name Field */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Person's name"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  border: '2px solid #ff007f',
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px' // iOS touch target minimum
                }}
              />
            </div>

            {/* Instagram Field */}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <input
                type="text"
                autoComplete="username"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                onBlur={() => handleFieldBlur('instagram')}
                placeholder="Instagram handle (without @)"
                style={{
                  width: '100%',
                  padding: '1rem',
                  paddingRight: isValidInstagramHandle(formData.instagram) ? '60px' : '1rem',
                  fontSize: '1rem',
                  border: `2px solid ${validationErrors.instagram ? '#FFE200' : '#ff007f'}`,
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px' // iOS touch target minimum
                }}
              />
              
              {/* Instagram link button */}
              {isValidInstagramHandle(formData.instagram) && (
                <button
                  type="button"
                  onClick={() => window.open(`https://instagram.com/${formData.instagram}`, '_blank', 'noopener,noreferrer')}
                  style={{
                    position: 'absolute',
                    right: '2px',
                    top: '2px',
                    bottom: '2px',
                    width: '54px',
                    background: '#ff007f',
                    border: 'none',
                    borderRadius: '0',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    lineHeight: '1',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    paddingBottom: '6px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6006b'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ff007f'}
                  title={`Open @${formData.instagram} on Instagram`}
                >
                  {/* Instagram icon using Unicode */}
                  📷
                </button>
              )}
            </div>

            {/* Phone Field */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                placeholder="Phone number"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  border: `2px solid ${validationErrors.phone ? '#FFE200' : '#ff007f'}`,
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px' // iOS touch target minimum
                }}
              />
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="Email address"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  border: `2px solid ${validationErrors.email ? '#FFE200' : '#ff007f'}`,
                  borderRadius: '0',
                  background: '#222',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  minHeight: '44px' // iOS touch target minimum
                }}
              />
            </div>
          </div>

          {/* Reserved space for validation errors */}
          <div style={{ 
            minHeight: '120px', 
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%'
          }}>
            {Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 && (
              <div style={{ 
                width: '100%',
                background: '#222',
                border: '2px solid #FFE200',
                padding: '0.75rem',
                boxSizing: 'border-box'
              }}>
                {Object.keys(validationErrors)
                  .filter(key => validationErrors[key])
                  .map((key, index) => (
                    <div key={key} style={{
                      color: '#FFE200',
                      fontSize: '0.75rem',
                      textAlign: 'center',
                      lineHeight: '1.3',
                      marginBottom: index < Object.keys(validationErrors).filter(k => validationErrors[k]).length - 1 ? '0.5rem' : '0',
                      fontFamily: '"IBM Plex Mono", monospace'
                    }}>
                      {validationErrors[key]}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <RoughCanvas
              width={400}
              height={80}
              options={{
                roughness: 1.5,
                strokeWidth: 3,
                stroke: '#ff007f',
                fill: '#ff007f',
                fillStyle: 'solid'
              }}
              shapes={[
                { type: 'rectangle', x: 0, y: 0, width: 400, height: 80 }
              ]}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            />
            <motion.button
              whileHover={{ scale: Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 ? 1 : 1.05 }}
              whileTap={{ scale: Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 ? 1 : 0.95 }}
              onClick={getCurrentLocation}
              disabled={Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '400px',
                height: '80px',
                fontSize: '1.5rem',
                background: 'transparent',
                color: Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 ? '#666' : '#fff',
                border: 'none',
                cursor: Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 ? 'not-allowed' : 'pointer',
                zIndex: 1,
                opacity: Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
                padding: 0,
                fontFamily: '"Kirang Haerang", cursive'
              }}
            >
              <span style={{ fontFamily: '"Kirang Haerang", cursive !important' }}>
                Create Encounter
              </span>
            </motion.button>
          </div>

          {error && (
            <div style={{ 
              color: '#ff6b6b', 
              marginTop: '1rem', 
              padding: '1rem',
              background: '#222',
              borderRadius: '8px',
              border: '1px solid #ff6b6b'
            }}>
              {error}
            </div>
          )}
        </motion.div>
      )}

      {step === 'loading' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌍</div>
          <h2 style={{ color: '#ff007f' }}>Getting location...</h2>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid #ff007f', 
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '2rem auto'
          }}></div>
        </motion.div>
      )}

      {step === 'qr' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', maxWidth: '500px' }}
        >
          <h2 style={{ color: '#ff007f', marginBottom: '1rem' }}>QR Code Ready!</h2>
          
          <div style={{ 
            background: '#fff', 
            padding: '2rem', 
            borderRadius: '12px',
            marginBottom: '2rem',
            display: 'inline-block'
          }}>
            <QRCode 
              value={qrUrl}
              size={300}
              level="M"
              includeMargin={true}
            />
          </div>

          <div style={{ 
            background: '#222', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            {placeName ? (
              <>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Place:</strong> {placeName}
                </div>
                <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                  <strong>Address:</strong> {address}
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Location:</strong> {address}
              </div>
            )}
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>URL:</strong> <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{qrUrl}</span>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <RoughCanvas
              width={400}
              height={60}
              options={{
                roughness: 1.5,
                strokeWidth: 2,
                stroke: '#ff007f',
                fill: '#333',
                fillStyle: 'solid'
              }}
              shapes={[
                { type: 'rectangle', x: 0, y: 0, width: 400, height: 60 }
              ]}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetFlow}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '400px',
                height: '60px',
                fontSize: '1.5rem',
                background: 'transparent',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
                padding: 0,
                fontFamily: '"Kirang Haerang", cursive'
              }}
            >
              <span style={{ fontFamily: '"Kirang Haerang", cursive !important' }}>
                Create Another
              </span>
            </motion.button>
          </div>
        </motion.div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EncounterCreator;