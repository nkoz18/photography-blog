'use strict';

module.exports = ({ strapi }) => ({
  async reverse(lat, lng) {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    
    try {
      // Check cache first
      const cached = await this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Call Google Geocoding API
      const apiKey = process.env.GOOGLE_GEO_API_KEY;
      if (!apiKey) {
        throw new Error('Google Geocoding API key not configured');
      }
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Geocoding failed: ${data.status || 'No results'}`);
      }
      
      const result = this.parseGeocodingResult(data.results[0]);
      
      // Cache the result
      await this.cacheResult(cacheKey, result);
      
      return result;
    } catch (error) {
      strapi.log.error('Geocoding error:', error);
      throw error;
    }
  },
  
  parseGeocodingResult(result) {
    const address = result.formatted_address;
    let placeName = null;
    
    // Look for business/place name in address components
    const placeTypes = ['establishment', 'point_of_interest', 'business'];
    const placeComponent = result.address_components.find(component =>
      component.types.some(type => placeTypes.includes(type))
    );
    
    if (placeComponent) {
      placeName = placeComponent.long_name;
    }
    
    return { address, placeName };
  },
  
  async getCachedResult(cacheKey) {
    try {
      const knex = strapi.db.connection;
      const result = await knex('geocode_cache').where('cache_key', cacheKey).first();
      
      if (result && this.isCacheValid(result.created_at)) {
        return {
          address: result.address,
          placeName: result.place_name
        };
      }
      
      return null;
    } catch (error) {
      // Table might not exist yet, ignore cache errors
      return null;
    }
  },
  
  async cacheResult(cacheKey, result) {
    try {
      const knex = strapi.db.connection;
      
      // Create table if it doesn't exist
      const tableExists = await knex.schema.hasTable('geocode_cache');
      if (!tableExists) {
        await knex.schema.createTable('geocode_cache', (table) => {
          table.increments('id').primary();
          table.string('cache_key').unique().notNullable();
          table.text('address').notNullable();
          table.string('place_name');
          table.timestamp('created_at').defaultTo(knex.fn.now());
        });
      }
      
      await knex('geocode_cache').insert({
        cache_key: cacheKey,
        address: result.address,
        place_name: result.placeName
      }).onConflict('cache_key').merge();
      
    } catch (error) {
      strapi.log.warn('Failed to cache geocoding result:', error);
      // Don't throw - caching is optional
    }
  },
  
  isCacheValid(createdAt) {
    const cacheAgeMs = Date.now() - new Date(createdAt).getTime();
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    return cacheAgeMs < maxAgeMs;
  }
});