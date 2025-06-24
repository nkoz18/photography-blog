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

    strapi.log.info(`🔍 [Instagram] Checking handle: "${handle}" (cache key: ${key}, TTL: ${ttlMinutes}m)`);

    return memo(key, ttlMinutes, async () => {
      strapi.log.info(`🔍 [Instagram] Starting verification for handle: "${handle}"`);
      
      try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        strapi.log.info(`🔍 [Instagram] Making GET request to: https://www.instagram.com/${handle}/`);
        
        // Use iPhone Safari User-Agent to mimic mobile browser
        const response = await fetch(`https://www.instagram.com/${handle}/`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
          }
        });

        clearTimeout(timeoutId);
        
        strapi.log.info(`🔍 [Instagram] Response status for "${handle}": ${response.status}`);
        strapi.log.info(`🔍 [Instagram] Response headers for "${handle}":`, Object.fromEntries(response.headers.entries()));

        if (response.status === 429) {
          // Rate limited - cache as "unknown" for 30 minutes
          const shortTtlKey = `ig:rl:${handle}`;
          memo(shortTtlKey, 30, () => null);
          strapi.log.warn(`🔍 [Instagram] Rate limited for handle: ${handle}, status: ${response.status}`);
          return null; // Unknown status
        }

        if (!response.ok) {
          // Any error status (404, 403, 500, etc.) - treat as unknown
          strapi.log.warn(`🔍 [Instagram] Error status for handle: ${handle}, status: ${response.status}`);
          return null; // Unknown status
        }

        // Get the HTML content
        const html = await response.text();
        const htmlLength = html.length;
        
        strapi.log.info(`🔍 [Instagram] HTML content length for "${handle}": ${htmlLength} characters`);
        
        // Log a snippet of the HTML for debugging (first 500 chars)
        const htmlSnippet = html.substring(0, 500).replace(/\n/g, ' ').replace(/\s+/g, ' ');
        strapi.log.info(`🔍 [Instagram] HTML snippet for "${handle}": "${htmlSnippet}..."`);

        // Check for specific phrases that indicate non-public profiles
        const isNotFound = html.includes("Sorry, this page isn't available.");
        const isPrivate = html.includes("This Account is Private");
        
        strapi.log.info(`🔍 [Instagram] Content analysis for "${handle}":`);
        strapi.log.info(`  - Contains "Sorry, this page isn't available.": ${isNotFound}`);
        strapi.log.info(`  - Contains "This Account is Private": ${isPrivate}`);

        if (isNotFound) {
          strapi.log.info(`🔍 [Instagram] Result for "${handle}": DOES NOT EXIST (false)`);
          return false; // Profile doesn't exist
        }
        
        if (isPrivate) {
          strapi.log.info(`🔍 [Instagram] Result for "${handle}": PRIVATE PROFILE (false)`);
          return false; // Private profile
        }

        // If neither phrase is found, assume it's a public profile
        strapi.log.info(`🔍 [Instagram] Result for "${handle}": PUBLIC PROFILE (true)`);
        return true;
      } catch (error) {
        if (error.name === 'AbortError') {
          strapi.log.warn(`🔍 [Instagram] Timeout for handle: "${handle}" after ${timeoutMs}ms`);
        } else {
          strapi.log.error(`🔍 [Instagram] Error for handle: "${handle}":`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        strapi.log.info(`🔍 [Instagram] Result for "${handle}": ERROR/TIMEOUT (null)`);
        return null; // Unknown status on error
      }
    });
  }
};