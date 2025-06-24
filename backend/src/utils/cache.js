'use strict';

function createMemoCache() {
  const cache = new Map(); // key → { data, expires }
  
  return function memo(key, ttlMinutes, fetcher) {
    const now = Date.now();
    const cached = cache.get(key);
    
    if (cached && now < cached.expires) {
      const minutesLeft = Math.round((cached.expires - now) / (1000 * 60));
      console.log(`📦 [Cache] HIT for key "${key}" (expires in ${minutesLeft}m)`);
      return cached.data;
    }
    
    if (cached && now >= cached.expires) {
      console.log(`📦 [Cache] EXPIRED for key "${key}"`);
      cache.delete(key);
    }
    
    console.log(`📦 [Cache] MISS for key "${key}" - fetching new data`);
    
    // Execute fetcher and cache the result
    const dataPromise = fetcher();
    
    // Handle both sync and async fetchers
    if (dataPromise && typeof dataPromise.then === 'function') {
      return dataPromise.then(data => {
        const expiresAt = now + (ttlMinutes * 60 * 1000);
        cache.set(key, {
          data,
          expires: expiresAt
        });
        console.log(`📦 [Cache] STORED key "${key}" (TTL: ${ttlMinutes}m)`);
        return data;
      });
    } else {
      const expiresAt = now + (ttlMinutes * 60 * 1000);
      cache.set(key, {
        data: dataPromise,
        expires: expiresAt
      });
      console.log(`📦 [Cache] STORED key "${key}" (TTL: ${ttlMinutes}m)`);
      return dataPromise;
    }
  };
}

module.exports = { createMemoCache };