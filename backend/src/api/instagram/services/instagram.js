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

        // Use iPhone Safari User-Agent to mimic mobile browser
        const response = await fetch(`https://www.instagram.com/${handle}/`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
          }
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          // Rate limited - cache as "unknown" for 30 minutes
          const shortTtlKey = `ig:rl:${handle}`;
          memo(shortTtlKey, 30, () => null);
          strapi.log.warn(`Instagram rate limited for handle: ${handle}, status: ${response.status}`);
          return null; // Unknown status
        }

        if (!response.ok) {
          // Any error status (404, 403, 500, etc.) - treat as unknown
          strapi.log.warn(`Instagram returned error status for handle: ${handle}, status: ${response.status}`);
          return null; // Unknown status
        }

        // Get the HTML content
        const html = await response.text();

        // Check for specific phrases that indicate non-public profiles
        const isNotFound = html.includes("Sorry, this page isn't available.");
        const isPrivate = html.includes("This Account is Private");

        if (isNotFound || isPrivate) {
          return false; // Not a public profile (either doesn't exist or is private)
        }

        // If neither phrase is found, assume it's a public profile
        return true;
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