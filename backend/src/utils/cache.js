'use strict';

function createMemoCache() {
  const cache = new Map(); // key → { data, expires }
  
  return function memo(key, ttlMinutes, fetcher) {
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
  };
}

module.exports = { createMemoCache };