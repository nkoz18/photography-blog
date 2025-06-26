'use strict';

const fetch = require('node-fetch');

const cache = new Map(); // key → { data, expires }

function memo(key, ttlMinutes, fetcher) {
  const now = Date.now();
  const cached = cache.get(key);
  
  if (cached && now < cached.expires) {
    return cached.data;
  }
  
  // Execute fetcher and cache the result
  const dataPromise = fetcher();
  
  // Handle both sync and async fetchers
  if (dataPromise && typeof dataPromise.then === 'function') {
    return dataPromise.then(data => {
      cache.set(key, {
        data,
        expires: now + (ttlMinutes * 60 * 1000)
      });
      return data;
    });
  } else {
    cache.set(key, {
      data: dataPromise,
      expires: now + (ttlMinutes * 60 * 1000)
    });
    return dataPromise;
  }
}

module.exports = {
  async autocomplete(input) {
    const key = `ac:${input}`;
    return memo(key, +process.env.PLACES_CACHE_TTL_MINUTES || 1440, async () => {
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.append('input', input);
      url.searchParams.append('types', 'geocode|establishment');
      url.searchParams.append('key', process.env.GOOGLE_GEO_API_KEY);

      const res = await fetch(url);
      const json = await res.json();
      
      if (json.status !== 'OK') {
        console.error('Google Places API Error:', json.status, json.error_message);
        throw new Error(`Google Places API Error: ${json.status} - ${json.error_message || 'Unknown error'}`);
      }
      
      return json.predictions || [];
    });
  },

  async details(placeId) {
    const key = `dt:${placeId}`;
    return memo(key, +process.env.PLACES_CACHE_TTL_MINUTES || 1440, async () => {
      const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      url.searchParams.append('place_id', placeId);
      url.searchParams.append('fields', 'formatted_address,name,geometry,place_id,address_components,types,international_phone_number,website,rating,opening_hours');
      url.searchParams.append('key', process.env.GOOGLE_GEO_API_KEY);

      const res = await fetch(url);
      const json = await res.json();
      
      if (json.status !== 'OK') {
        console.error('Google Places API Error:', json.status, json.error_message);
        throw new Error(`Google Places API Error: ${json.status} - ${json.error_message || 'Unknown error'}`);
      }
      
      return json.result || {};
    });
  },
};