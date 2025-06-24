'use strict';

const { createMemoCache } = require('../../../utils/cache');

// Create a separate cache for Instagram checks
const memo = createMemoCache();

module.exports = {
  async exists(handle) {
    // Validate handle format before making request
    if (!handle || !/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
      return null; // Invalid format
    }

    const key = `ig:${handle}`;
    const ttlMinutes = +process.env.IG_CHECK_TTL_MINUTES || 1440; // 24 hours default
    const timeoutMs = +process.env.IG_FETCH_TIMEOUT_MS || 3000; // 3 seconds default

    return memo(key, ttlMinutes, async () => {
      try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`https://www.instagram.com/${handle}/`, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0; +https://silkytruth.com)'
          }
        });

        clearTimeout(timeoutId);

        if (response.status === 200) {
          return true; // Profile exists
        } else if (response.status === 404) {
          return false; // Profile doesn't exist
        } else if (response.status === 429) {
          // Rate limited - cache as "unknown" for 30 minutes
          const shortTtlKey = `ig:rl:${handle}`;
          memo(shortTtlKey, 30, () => null);
          strapi.log.warn(`Instagram rate limited for handle: ${handle}, status: ${response.status}`);
          return null; // Unknown status
        } else {
          // Any other status (403, 500, etc.) - treat as unknown
          strapi.log.warn(`Instagram returned unexpected status for handle: ${handle}, status: ${response.status}`);
          return null; // Unknown status
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          strapi.log.warn(`Instagram check timeout for handle: ${handle}`);
        } else {
          strapi.log.warn(`Instagram check error for handle: ${handle}`, error.message);
        }
        return null; // Unknown status on error
      }
    });
  }
};