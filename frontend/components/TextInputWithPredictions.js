import React, { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import debounce from 'lodash.debounce';
import { getStrapiURL } from '../lib/api';

const TextInputWithPredictions = ({ 
  value, 
  onChange, 
  onResolvedAddressChange,
  placeholder = "Enter address or location",
  style = {},
  validationError = null 
}) => {
  const [query, setQuery] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  
  // Simple cache to avoid redundant API calls
  const cacheRef = useRef(new Map());
  
  // Update query when external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Debounced function to fetch predictions
  const debouncedGetPredictions = useRef(
    debounce(async (input) => {
      console.log('🔍 [Places] Starting prediction fetch for input:', `"${input}"`);
      
      if (!input || input.length < 3) {
        console.log('🔍 [Places] Input too short, clearing predictions. Length:', input?.length);
        setPredictions([]);
        return;
      }

      // Check cache first
      if (cacheRef.current.has(input)) {
        console.log('🔍 [Places] Found cached result for:', `"${input}"`);
        const cachedResult = cacheRef.current.get(input);
        console.log('🔍 [Places] Cached predictions:', cachedResult);
        setPredictions(cachedResult);
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 [Places] Making Strapi-proxied Google Places API call for:', `"${input}"`);
        
        const apiUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
          ? 'http://localhost:1337'
          : getStrapiURL();
        
        const response = await fetch(`${apiUrl}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const predictions = await response.json();
        
        // Limit to 5 results as requested
        const limitedPredictions = predictions.slice(0, 5);
        
        console.log('🔍 [Places] Strapi proxy response:', limitedPredictions);
        
        const data = { status: 'OK', predictions: limitedPredictions };
        
        console.log('🔍 [Places] API response data:', data);
        console.log('🔍 [Places] Response status:', data.status);
        console.log('🔍 [Places] Predictions count:', data.predictions?.length || 0);
        
        if (data.status === 'OK' && data.predictions) {
          // Limit to top 5 predictions
          const limitedPredictions = data.predictions.slice(0, 5);
          
          // Cache the result
          cacheRef.current.set(input, limitedPredictions);
          console.log('🔍 [Places] Cached result for future use');
          
          // Keep cache size reasonable
          if (cacheRef.current.size > 30) {
            const firstKey = cacheRef.current.keys().next().value;
            cacheRef.current.delete(firstKey);
            console.log('🔍 [Places] Cache cleanup: removed oldest entry');
          }
          
          console.log('🔍 [Places] Setting predictions in state (limited to 5):', limitedPredictions);
          setPredictions(limitedPredictions);
        } else {
          console.log('🔍 [Places] No valid predictions in response, clearing');
          setPredictions([]);
        }
      } catch (error) {
        console.error('🔍 [Places] ERROR fetching predictions:', error);
        console.error('🔍 [Places] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setPredictions([]);
      }
      
      console.log('🔍 [Places] Finished prediction fetch, setting loading to false');
      setIsLoading(false);
    }, 300)
  ).current;

  // Handle input change
  const handleInputChange = (newValue) => {
    console.log('🔍 [Input] Input changed:', `"${newValue}"`, 'Length:', newValue?.length);
    
    setQuery(newValue);
    onChange?.(newValue);
    
    // Clear resolved address when user types
    if (resolvedAddress) {
      console.log('🔍 [Input] Clearing resolved address because user is typing');
      setResolvedAddress(null);
      onResolvedAddressChange?.(null);
    }
    
    // Start loading and fetch predictions
    if (newValue && newValue.length >= 3) {
      console.log('🔍 [Input] Input length >= 3, starting prediction fetch...');
      setIsLoading(true);
      debouncedGetPredictions(newValue);
    } else {
      console.log('🔍 [Input] Input too short, clearing predictions and stopping loading');
      setPredictions([]);
      setIsLoading(false);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = async (prediction) => {
    console.log('🔍 [Selection] User selected prediction:', prediction);
    
    setQuery(prediction.description);
    onChange?.(prediction.description);
    setPredictions([]);
    
    console.log('🔍 [Selection] Updated query and cleared predictions');
    
    // Get place details
    try {
      console.log('🔍 [Selection] Starting place details fetch via Strapi proxy');
      console.log('🔍 [Selection] Place ID:', prediction.place_id);
      
      const apiUrl = process.env.NODE_ENV === 'development' && !process.env.USE_CLOUD_BACKEND
        ? 'http://localhost:1337'
        : getStrapiURL();
      
      const response = await fetch(`${apiUrl}/api/places/details?place_id=${encodeURIComponent(prediction.place_id)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('🔍 [Selection] Strapi proxy details response:', result);
      
      const data = { status: 'OK', result };
      
      console.log('🔍 [Selection] Place details response:', data);
      console.log('🔍 [Selection] Response status:', data.status);
      console.log('🔍 [Selection] Result data:', data.result);
      
      if (data.status === 'OK' && data.result) {
        const resolved = {
          formatted_address: data.result.formatted_address,
          name: data.result.name,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng
        };
        
        console.log('🔍 [Selection] Created resolved address object:', resolved);
        
        setResolvedAddress(resolved);
        onResolvedAddressChange?.(resolved);
        
        console.log('🔍 [Selection] Updated state with resolved address');
      } else {
        console.log('🔍 [Selection] No valid result in place details response');
      }
    } catch (error) {
      console.error('🔍 [Selection] ERROR fetching place details:', error);
      console.error('🔍 [Selection] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  };

  console.log('🔍 [Render] Component rendering with state:');
  console.log('  - query:', `"${query}"`);
  console.log('  - predictions.length:', predictions.length);
  console.log('  - predictions:', predictions);
  console.log('  - isLoading:', isLoading);
  console.log('  - resolvedAddress:', resolvedAddress);
  console.log('  - validationError:', validationError);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Combobox value={query} onChange={handlePredictionSelect}>
        <div style={{ position: 'relative' }}>
          <Combobox.Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              border: `2px solid ${validationError ? '#ff6b6b' : '#ff007f'}`,
              borderRadius: '0',
              background: '#222',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              ...style
            }}
          />
          
          {isLoading && (
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.8rem',
              color: '#888'
            }}>
              ...
            </div>
          )}
        </div>

        {predictions.length > 0 && (
          <Combobox.Options
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#222',
              border: '2px solid #ff007f',
              borderTop: 'none',
              borderRadius: '0',
              maxHeight: 'none',
              overflowY: 'visible',
              zIndex: 1000,
              listStyle: 'none',
              margin: 0,
              padding: 0
            }}
          >
            {predictions.map((prediction) => (
              <Combobox.Option
                key={prediction.place_id}
                value={prediction}
                style={{ cursor: 'pointer' }}
              >
                {({ active }) => (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: active ? '#ff007f' : 'transparent',
                      color: active ? '#fff' : '#ccc',
                      borderBottom: '1px solid #333'
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: active ? 'bold' : 'normal' }}>
                      {prediction.structured_formatting?.main_text || prediction.description}
                    </div>
                    {prediction.structured_formatting?.secondary_text && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                        {prediction.structured_formatting.secondary_text}
                      </div>
                    )}
                  </div>
                )}
              </Combobox.Option>
            ))}
            
            {predictions.length === 0 && query.length >= 3 && !isLoading && (
              <div style={{
                padding: '0.75rem 1rem',
                color: '#888',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                No matches, keep typing or enter address manually
              </div>
            )}
          </Combobox.Options>
        )}
      </Combobox>
    </div>
  );
};

export default TextInputWithPredictions;