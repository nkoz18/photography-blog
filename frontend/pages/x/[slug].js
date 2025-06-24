import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getStrapiURL } from '../../lib/api';
import Seo from '../../components/seo';

const EncounterPage = ({ slug }) => {
  const [step, setStep] = useState('loading'); // 'loading', 'form', 'thank-you', 'error'
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (slug) {
      fetchEncounter();
    }
  }, [slug]);

  const fetchEncounter = async () => {
    try {
      const apiUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
        ? 'http://localhost:1337'
        : getStrapiURL();

      const response = await fetch(`${apiUrl}/api/photo-encounters?filters[slug]=${slug}&populate=*`);
      
      if (!response.ok) {
        throw new Error('Encounter not found');
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('Encounter not found');
      }

      setEncounter(data.data[0]);
      setStep('form');
    } catch (err) {
      setError(err.message);
      setStep('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one contact method
    if (!formData.phone && !formData.email && !formData.instagram) {
      setError('Please provide at least one way to contact you');
      return;
    }

    setSubmitting(true);
    setError('');

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
      fontFamily: 'Arial, sans-serif'
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📸</div>
          <h2 style={{ color: '#ff007f' }}>Loading...</h2>
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸✨</div>
            <h1 style={{ 
              fontSize: '2rem', 
              marginBottom: '1rem', 
              color: '#ff007f',
              textShadow: '0 0 20px rgba(255, 0, 127, 0.3)'
            }}>
              Hi, I&apos;m Nikita!
            </h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.9 }}>
              Thanks for letting me photograph you{encounter.attributes.placeName && ` at ${encounter.attributes.placeName}`}! 
              Share your contact info and I&apos;ll let you know when your photos are ready.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            style={{ marginBottom: '2rem' }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
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
                  borderRadius: '8px',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
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
                  borderRadius: '8px',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
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
                  borderRadius: '8px',
                  background: '#222',
                  color: '#fff',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#ff007f'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
              />
            </div>

            {error && (
              <div style={{ 
                color: '#ff6b6b', 
                marginBottom: '1rem', 
                padding: '0.5rem',
                textAlign: 'center',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '1.2rem',
                fontSize: '1.2rem',
                background: submitting ? '#666' : '#ff007f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              {submitting ? 'Submitting...' : '✨ Submit'}
            </motion.button>
          </motion.form>

          <div style={{ 
            textAlign: 'center', 
            fontSize: '0.9rem', 
            opacity: 0.7,
            color: '#ccc'
          }}>
            At least one contact method required
          </div>
        </motion.div>
      )}

      {step === 'thank-you' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: '400px' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ 
            color: '#ff007f', 
            marginBottom: '1rem',
            textShadow: '0 0 20px rgba(255, 0, 127, 0.3)'
          }}>
            Perfect!
          </h2>
          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.6', 
            marginBottom: '2rem',
            opacity: 0.9
          }}>
            I&apos;ll text you when your photos are ready. Feel free to follow me on Instagram for more street photography!
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInstagramDeepLink}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0 auto'
            }}
          >
            📷 Follow @silkytruth
          </motion.button>
        </motion.div>
      )}

      {step === 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', maxWidth: '400px' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😔</div>
          <h2 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Oops!</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', opacity: 0.9 }}>
            {error}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export async function getStaticPaths() {
  // Return empty paths to avoid pre-generating any pages
  return {
    paths: [],
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      slug: params.slug
    },
    revalidate: false // No revalidation needed for encounter pages
  };
}

export default EncounterPage;