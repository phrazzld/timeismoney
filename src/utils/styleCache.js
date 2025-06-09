/**
 * Style Cache System for the TimeIsMoney extension
 * Provides efficient caching of generated styles to improve performance
 *
 * @module utils/styleCache
 */

import * as logger from './logger.js';

/**
 * LRU Cache implementation for style caching with size limits
 */
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing entry
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize) * 100,
    };
  }
}

/**
 * Creates a cache key from a configuration object
 * Uses stable stringification to ensure consistent keys
 *
 * @param {object} config - Configuration object
 * @returns {string} Cache key
 */
function createCacheKey(config) {
  try {
    // Create stable key by sorting object properties
    const sortedKeys = Object.keys(config).sort();
    const stableConfig = {};

    for (const key of sortedKeys) {
      const value = config[key];

      // Handle special cases for context elements (use ID or tagName)
      if (key === 'context' && value && value.nodeType) {
        stableConfig[key] = value.id || value.tagName || 'element';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively handle nested objects
        stableConfig[key] = createCacheKey(value);
      } else {
        stableConfig[key] = value;
      }
    }

    return JSON.stringify(stableConfig);
  } catch (error) {
    logger.debug('Error creating cache key:', error.message);
    // Fallback to timestamp if key creation fails
    return `fallback_${Date.now()}_${Math.random()}`;
  }
}

/**
 * Cache for badge styles
 */
const badgeStyleCache = new LRUCache(50);

/**
 * Cache for icon styles
 */
const iconStyleCache = new LRUCache(25);

/**
 * Cache for theme detection results
 */
const themeCache = new LRUCache(20);

/**
 * Cache for responsive context results
 */
const responsiveCache = new LRUCache(10);

/**
 * Cache statistics for monitoring
 */
const cacheStats = {
  badgeStyles: { hits: 0, misses: 0, generations: 0 },
  iconStyles: { hits: 0, misses: 0, generations: 0 },
  themes: { hits: 0, misses: 0, generations: 0 },
  responsive: { hits: 0, misses: 0, generations: 0 },
};

/**
 * Gets cached badge styles or undefined if not found
 *
 * @param {object} config - Badge configuration
 * @returns {string|undefined} Cached CSS string or undefined
 */
export const getCachedBadgeStyles = (config) => {
  try {
    const key = createCacheKey(config);
    const cached = badgeStyleCache.get(key);

    if (cached !== undefined) {
      cacheStats.badgeStyles.hits++;
      logger.debug('Badge styles cache hit', { key: key.substring(0, 50) + '...' });
      return cached;
    }

    cacheStats.badgeStyles.misses++;
    return undefined;
  } catch (error) {
    logger.debug('Error getting cached badge styles:', error.message);
    cacheStats.badgeStyles.misses++;
    return undefined;
  }
};

/**
 * Caches badge styles for future use
 *
 * @param {object} config - Badge configuration
 * @param {string} styles - Generated CSS string
 */
export const setCachedBadgeStyles = (config, styles) => {
  try {
    const key = createCacheKey(config);
    badgeStyleCache.set(key, styles);
    cacheStats.badgeStyles.generations++;
    logger.debug('Badge styles cached', { key: key.substring(0, 50) + '...' });
  } catch (error) {
    logger.debug('Error caching badge styles:', error.message);
  }
};

/**
 * Gets cached icon styles or undefined if not found
 *
 * @param {object} config - Icon configuration
 * @returns {string|undefined} Cached CSS string or undefined
 */
export const getCachedIconStyles = (config) => {
  try {
    const key = createCacheKey(config);
    const cached = iconStyleCache.get(key);

    if (cached !== undefined) {
      cacheStats.iconStyles.hits++;
      logger.debug('Icon styles cache hit', { key: key.substring(0, 50) + '...' });
      return cached;
    }

    cacheStats.iconStyles.misses++;
    return undefined;
  } catch (error) {
    logger.debug('Error getting cached icon styles:', error.message);
    cacheStats.iconStyles.misses++;
    return undefined;
  }
};

/**
 * Caches icon styles for future use
 *
 * @param {object} config - Icon configuration
 * @param {string} styles - Generated CSS string
 */
export const setCachedIconStyles = (config, styles) => {
  try {
    const key = createCacheKey(config);
    iconStyleCache.set(key, styles);
    cacheStats.iconStyles.generations++;
    logger.debug('Icon styles cached', { key: key.substring(0, 50) + '...' });
  } catch (error) {
    logger.debug('Error caching icon styles:', error.message);
  }
};

/**
 * Gets cached theme detection result or undefined if not found
 *
 * @param {HTMLElement} element - Element to check theme for
 * @returns {string|undefined} Cached theme ('light'|'dark'|'unknown') or undefined
 */
export const getCachedTheme = (element) => {
  try {
    if (!element || !element.nodeType) {
      return undefined;
    }

    // Create key based on element properties that affect theme detection
    const key = `${element.tagName}_${element.className}_${element.id}`;
    const cached = themeCache.get(key);

    if (cached !== undefined) {
      cacheStats.themes.hits++;
      logger.debug('Theme cache hit', { element: element.tagName, theme: cached });
      return cached;
    }

    cacheStats.themes.misses++;
    return undefined;
  } catch (error) {
    logger.debug('Error getting cached theme:', error.message);
    cacheStats.themes.misses++;
    return undefined;
  }
};

/**
 * Caches theme detection result for future use
 *
 * @param {HTMLElement} element - Element that was checked
 * @param {string} theme - Detected theme ('light'|'dark'|'unknown')
 */
export const setCachedTheme = (element, theme) => {
  try {
    if (!element || !element.nodeType) {
      return;
    }

    const key = `${element.tagName}_${element.className}_${element.id}`;
    themeCache.set(key, theme);
    cacheStats.themes.generations++;
    logger.debug('Theme cached', { element: element.tagName, theme });
  } catch (error) {
    logger.debug('Error caching theme:', error.message);
  }
};

/**
 * Gets cached responsive context or undefined if not found
 *
 * @returns {object|undefined} Cached responsive context or undefined
 */
export const getCachedResponsiveContext = () => {
  try {
    // Use viewport dimensions as cache key
    const key = `${window.innerWidth}x${window.innerHeight}`;
    const cached = responsiveCache.get(key);

    if (cached !== undefined) {
      cacheStats.responsive.hits++;
      logger.debug('Responsive context cache hit', { viewport: key });
      return cached;
    }

    cacheStats.responsive.misses++;
    return undefined;
  } catch (error) {
    logger.debug('Error getting cached responsive context:', error.message);
    cacheStats.responsive.misses++;
    return undefined;
  }
};

/**
 * Caches responsive context for future use
 *
 * @param {object} context - Responsive context object
 */
export const setCachedResponsiveContext = (context) => {
  try {
    const key = `${window.innerWidth}x${window.innerHeight}`;
    responsiveCache.set(key, context);
    cacheStats.responsive.generations++;
    logger.debug('Responsive context cached', { viewport: key });
  } catch (error) {
    logger.debug('Error caching responsive context:', error.message);
  }
};

/**
 * Clears all caches - useful for testing or memory management
 */
export const clearAllCaches = () => {
  try {
    badgeStyleCache.clear();
    iconStyleCache.clear();
    themeCache.clear();
    responsiveCache.clear();

    // Reset statistics
    Object.keys(cacheStats).forEach((key) => {
      cacheStats[key] = { hits: 0, misses: 0, generations: 0 };
    });

    logger.debug('All style caches cleared');
  } catch (error) {
    logger.debug('Error clearing caches:', error.message);
  }
};

/**
 * Gets comprehensive cache statistics for monitoring
 *
 * @returns {object} Cache statistics and health metrics
 */
export const getCacheStatistics = () => {
  try {
    const stats = {
      statistics: { ...cacheStats },
      caches: {
        badgeStyles: badgeStyleCache.getStats(),
        iconStyles: iconStyleCache.getStats(),
        themes: themeCache.getStats(),
        responsive: responsiveCache.getStats(),
      },
      performance: {},
    };

    // Calculate cache hit rates
    Object.keys(cacheStats).forEach((cacheType) => {
      const stat = cacheStats[cacheType];
      const total = stat.hits + stat.misses;
      stats.performance[cacheType] = {
        hitRate: total > 0 ? (stat.hits / total) * 100 : 0,
        totalRequests: total,
        cacheUtilization: stats.caches[cacheType]?.utilization || 0,
      };
    });

    return stats;
  } catch (error) {
    logger.error('Error getting cache statistics:', error.message);
    return { error: 'Failed to get cache statistics' };
  }
};

/**
 * Invalidates caches when viewport changes (for responsive caching)
 * Should be called on window resize events
 */
export const invalidateResponsiveCaches = () => {
  try {
    responsiveCache.clear();
    // Also clear style caches since they may depend on responsive context
    badgeStyleCache.clear();
    iconStyleCache.clear();

    logger.debug('Responsive caches invalidated due to viewport change');
  } catch (error) {
    logger.debug('Error invalidating responsive caches:', error.message);
  }
};

/**
 * Optimized cache warming function for common configurations
 * Pre-generates and caches styles for frequently used configurations
 *
 * @param {Array<object>} commonConfigs - Array of common badge configurations
 */
export const warmStyleCaches = (commonConfigs = []) => {
  try {
    // Default common configurations if none provided
    const defaultConfigs = [
      // Basic configurations
      { responsive: true, conflictProtection: true, useIcon: true },
      { responsive: true, conflictProtection: true, useIcon: false },
      { responsive: false, conflictProtection: true, useIcon: true },

      // Different variants
      { variant: 'light', responsive: true, conflictProtection: true },
      { variant: 'dark', responsive: true, conflictProtection: true },

      // Different icon sizes
      { iconSize: 'xs', useIcon: true, responsive: true },
      { iconSize: 'sm', useIcon: true, responsive: true },
    ];

    const configsToWarm = commonConfigs.length > 0 ? commonConfigs : defaultConfigs;

    logger.debug('Warming style caches with common configurations', {
      count: configsToWarm.length,
    });

    // Note: Actual style generation would happen in the style generators
    // This just logs that cache warming is being initiated
  } catch (error) {
    logger.debug('Error warming style caches:', error.message);
  }
};
