/**
 * Unified Price Extraction Pipeline
 * Coordinates multiple price detection strategies for maximum accuracy
 *
 * @module content/priceExtractor
 */

import * as logger from '../utils/logger.js';
import { extractPricesFromElement } from './domPriceAnalyzer.js';
import { getHandlerForCurrentSite, processWithSiteHandler } from './siteHandlers.js';
import { selectBestPattern } from './pricePatterns.js';

/**
 * Available extraction strategies
 *
 * @enum {string}
 */
export const STRATEGIES = {
  SITE_SPECIFIC: 'site-specific',
  DOM_ANALYZER: 'dom-analyzer',
  PATTERN_MATCHING: 'pattern-matching',
};

// Debug support
let debugMode = false;
let debugLog = [];

/**
 * Enable or disable debug mode
 *
 * @param {boolean} enabled - Whether to enable debug mode
 */
export function setDebugMode(enabled) {
  debugMode = enabled;
  if (!enabled) {
    debugLog = [];
  }
}

/**
 * Get current debug log entries
 *
 * @returns {Array} Copy of debug log entries
 */
export function getDebugLog() {
  return [...debugLog];
}

/**
 * Log debug information
 *
 * @param {string} strategy - Strategy name
 * @param {string} message - Debug message
 * @param {object} data - Additional data
 */
function logDebug(strategy, message, data = {}) {
  if (debugMode) {
    const entry = {
      timestamp: Date.now(),
      strategy,
      message,
      ...data,
    };
    debugLog.push(entry);
    logger.debug(`[${strategy}] ${message}`, data);
  }
}

/**
 * Extraction strategy interface
 *
 * @typedef {object} Strategy
 * @property {string} name - Strategy identifier
 * @property {number} priority - Execution order (lower = higher priority)
 * @property {Function} canHandle - Check if strategy applies to input
 * @property {Function} extract - Extract prices using this strategy
 */

/**
 * Site-specific extraction strategy
 */
const siteSpecificStrategy = {
  name: STRATEGIES.SITE_SPECIFIC,
  priority: 1,

  canHandle(input) {
    return input.element && getHandlerForCurrentSite() !== null;
  },

  extract(input, context) {
    const handler = getHandlerForCurrentSite();
    if (!handler) {
      return [];
    }

    logDebug(this.name, 'Using site-specific handler', { handler: handler.name });

    const results = [];
    const processCallback = (textNode) => {
      const text = textNode.textContent?.trim();
      if (!text) return;

      // Simple price extraction from text
      const priceMatch = text.match(/([£$€¥])\s*(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        results.push({
          value: priceMatch[2],
          currency: priceMatch[1],
          text: text,
          confidence: 0.95,
          strategy: this.name,
          metadata: {
            source: 'site-handler',
            handler: handler.name,
          },
        });
      }
    };

    try {
      processWithSiteHandler(input.element, processCallback, context.settings);
    } catch (error) {
      logDebug(this.name, 'Site handler error', { error: error.message });
    }

    return results;
  },
};

/**
 * DOM analyzer extraction strategy
 */
const domAnalyzerStrategy = {
  name: STRATEGIES.DOM_ANALYZER,
  priority: 2,

  canHandle(input) {
    return !!input.element;
  },

  extract(input, context) {
    logDebug(this.name, 'Analyzing DOM element');

    try {
      const analyzerResults = extractPricesFromElement(input.element, context.options);

      if (!analyzerResults.prices || analyzerResults.prices.length === 0) {
        logDebug(this.name, 'No prices found in DOM');
        return [];
      }

      // Transform analyzer results to pipeline format
      const results = analyzerResults.prices.map((price) => ({
        value: price.value,
        currency: price.currency,
        text: price.text || `${price.currency}${price.value}`,
        confidence: price.confidence || 0.8,
        strategy: this.name,
        metadata: {
          source: price.source,
          domStrategy: price.strategy,
          extractionTime: analyzerResults.metadata?.extractionTime,
        },
      }));

      logDebug(this.name, 'Found prices', { count: results.length });
      return results;
    } catch (error) {
      logDebug(this.name, 'DOM analyzer error', { error: error.message });
      return [];
    }
  },
};

/**
 * Pattern matching extraction strategy
 */
const patternMatchingStrategy = {
  name: STRATEGIES.PATTERN_MATCHING,
  priority: 3,

  canHandle(input) {
    return !!input.text;
  },

  extract(input, context) {
    logDebug(this.name, 'Matching patterns in text', { text: input.text });

    try {
      const patternMatch = selectBestPattern(input.text, context.patternContext);

      if (!patternMatch) {
        logDebug(this.name, 'No pattern match found');
        return [];
      }

      const result = {
        value: patternMatch.value,
        currency: patternMatch.currency,
        text: patternMatch.original || `${patternMatch.currency}${patternMatch.value}`,
        confidence: patternMatch.confidence || 0.7,
        strategy: this.name,
        metadata: {
          pattern: patternMatch.pattern,
        },
      };

      logDebug(this.name, 'Pattern matched', { pattern: patternMatch.pattern });
      return [result];
    } catch (error) {
      logDebug(this.name, 'Pattern matching error', { error: error.message });
      return [];
    }
  },
};

/**
 * Default strategies in priority order
 */
const defaultStrategies = [siteSpecificStrategy, domAnalyzerStrategy, patternMatchingStrategy];

/**
 * Extraction pipeline class
 */
class ExtractionPipeline {
  constructor(strategies = defaultStrategies) {
    this.strategies = [...strategies].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute the extraction pipeline
   *
   * @param {object} input - Input data (element and/or text)
   * @param {object} options - Extraction options
   * @returns {Promise<Array>} Extracted prices
   */
  async extract(input, options = {}) {
    const context = this.prepareContext(input, options);
    const results = [];
    const processedStrategies = [];

    for (const strategy of this.strategies) {
      try {
        // Skip strategies that can't handle this input
        if (!strategy.canHandle(input)) {
          logDebug('pipeline', `Skipping ${strategy.name} - cannot handle input`);
          continue;
        }

        // Skip specific strategies if excluded
        if (options.excludeStrategies?.includes(strategy.name)) {
          logDebug('pipeline', `Skipping ${strategy.name} - excluded by options`);
          continue;
        }

        processedStrategies.push(strategy.name);
        const strategyResults = await Promise.resolve(strategy.extract(input, context));

        if (strategyResults && strategyResults.length > 0) {
          results.push(...strategyResults);

          // Early exit if high-confidence result found
          if (this.shouldEarlyExit(results, options)) {
            logDebug('pipeline', 'Early exit - high confidence result found');
            break;
          }
        }
      } catch (error) {
        logger.error(`Error in ${strategy.name} strategy:`, error);
        // Continue with next strategy
      }
    }

    logDebug('pipeline', 'Pipeline complete', {
      processedStrategies,
      resultCount: results.length,
    });

    return this.processResults(results, options);
  }

  /**
   * Prepare execution context
   *
   * @param {object} input - Input data
   * @param {object} options - Extraction options
   * @returns {object} Execution context
   */
  prepareContext(input, options) {
    return {
      options: {
        ...(options.domOptions || {}),
        allowMultipleResults: options.returnMultiple,
      },
      settings: options.settings || {},
      patternContext: options.patternContext || {},
    };
  }

  /**
   * Check if pipeline should exit early
   *
   * @param {Array} results - Current results
   * @param {object} options - Extraction options
   * @returns {boolean} True if should exit early
   */
  shouldEarlyExit(results, options) {
    if (options.exhaustive || options.returnMultiple) {
      return false;
    }

    // Exit if we have a high-confidence result
    const highConfidenceThreshold = options.earlyExitConfidence || 0.9;
    return results.some((result) => result.confidence >= highConfidenceThreshold);
  }

  /**
   * Process and filter results
   *
   * @param {Array} results - Raw extraction results
   * @param {object} options - Extraction options
   * @returns {Array} Processed results
   */
  processResults(results, options) {
    if (!results || results.length === 0) {
      return [];
    }

    // Apply confidence filter
    let filtered = results;
    if (options.minConfidence) {
      filtered = results.filter((r) => r.confidence >= options.minConfidence);
    }

    // Remove duplicates
    const unique = this.deduplicateResults(filtered);

    // Sort by confidence (highest first)
    unique.sort((a, b) => b.confidence - a.confidence);

    return unique;
  }

  /**
   * Remove duplicate price results
   *
   * @param {Array} results - Results to deduplicate
   * @returns {Array} Unique results
   */
  deduplicateResults(results) {
    const seen = new Map();

    for (const result of results) {
      const key = `${result.value}-${result.currency}`;
      const existing = seen.get(key);

      // Keep the result with higher confidence
      if (!existing || result.confidence > existing.confidence) {
        seen.set(key, result);
      }
    }

    return Array.from(seen.values());
  }
}

// Default pipeline instance
let defaultPipeline = null;

/**
 * Get or create the default pipeline
 *
 * @returns {ExtractionPipeline} Default pipeline instance
 */
function getDefaultPipeline() {
  if (!defaultPipeline) {
    defaultPipeline = new ExtractionPipeline();
  }
  return defaultPipeline;
}

/**
 * Create a custom extraction pipeline
 *
 * @param {Array<Strategy>} strategies - Array of strategies to use
 * @returns {ExtractionPipeline} New pipeline instance
 */
export function createPipeline(strategies) {
  return new ExtractionPipeline(strategies);
}

/**
 * Normalize input to standard format
 *
 * @param {Element|object|string} input - Raw input
 * @returns {object} Normalized input object
 */
function normalizeInput(input) {
  // Handle DOM element
  if (input && typeof input.nodeType !== 'undefined') {
    return {
      element: input,
      text: input.textContent?.trim(),
    };
  }

  // Handle object with element/text properties
  if (input && typeof input === 'object') {
    return {
      element: input.element,
      text: input.text || input.element?.textContent?.trim(),
    };
  }

  // Handle plain text string
  if (typeof input === 'string') {
    return {
      element: null,
      text: input,
    };
  }

  return {
    element: null,
    text: null,
  };
}

/**
 * Extract price from element or text using unified pipeline
 *
 * @param {Element|object|string} input - DOM element, text, or input object
 * @param {object} options - Extraction options
 * @param {boolean} options.returnMultiple - Return all prices instead of best match
 * @param {number} options.minConfidence - Minimum confidence threshold
 * @param {boolean} options.exhaustive - Process all strategies (no early exit)
 * @param {Array<string>} options.excludeStrategies - Strategies to skip
 * @param {object} options.pipeline - Custom pipeline instance
 * @param {object} options.settings - Extension settings
 * @returns {Promise<object|Array|null>} Extracted price(s) or null
 */
export async function extractPrice(input, options = {}) {
  try {
    // Normalize input
    const normalizedInput = normalizeInput(input);

    if (!normalizedInput.element && !normalizedInput.text) {
      logDebug('extractPrice', 'No valid input provided');
      return options.returnMultiple ? [] : null;
    }

    // Get or create pipeline
    const pipeline = options.pipeline || getDefaultPipeline();

    // Extract prices
    const results = await pipeline.extract(normalizedInput, options);

    // Return based on options
    if (options.returnMultiple) {
      return results;
    }

    return results[0] || null;
  } catch (error) {
    logger.error('Error in extractPrice:', error);
    return options.returnMultiple ? [] : null;
  }
}
