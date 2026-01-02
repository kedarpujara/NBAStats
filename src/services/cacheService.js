/**
 * Simple localStorage-based cache service with TTL (Time To Live)
 */

const CACHE_PREFIX = 'nba_stats_cache_';

export const cacheService = {
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to store
   * @param {number} ttlMinutes - Time to live in minutes
   */
  set: (key, value, ttlMinutes = 5) => {
    try {
      const now = new Date();
      const item = {
        value: value,
        expiry: now.getTime() + ttlMinutes * 60 * 1000,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - The cached value or null if expired/not found
   */
  get: (key) => {
    try {
      const itemStr = localStorage.getItem(CACHE_PREFIX + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = new Date();

      if (now.getTime() > item.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  /**
   * Clear a specific key or all cache
   * @param {string} [key] - Optional key to clear
   */
  clear: (key) => {
    if (key) {
      localStorage.removeItem(CACHE_PREFIX + key);
    } else {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    }
  }
};
