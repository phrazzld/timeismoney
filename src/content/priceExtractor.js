/**
 * Unified Price Extraction Pipeline
 * Coordinates multiple price detection strategies for maximum accuracy
 *
 * @module content/priceExtractor
 */

import * as logger from '../utils/logger.js';
import { debugPriceDetection } from '../utils/logger.js';
import {
  extractPricesFromElement,
  extractFromAttributes,
  assembleSplitComponents,
  extractNestedCurrency,
  extractContextualPrices,
  getElementContext,
} from './domPriceAnalyzer.js';
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

// logDebug function removed - replaced with enhanced debugPriceDetection

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

    debugPriceDetection('strategy-attempt', 'site-specific', { handler: handler.name });

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
      debugPriceDetection('strategy-result', 'site-specific', {
        error: error.message,
        success: false,
      });
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
    debugPriceDetection('strategy-attempt', 'dom-analyzer', { elementType: input.element.tagName });

    try {
      const analyzerResults = extractPricesFromElement(input.element, context.options);

      if (!analyzerResults.prices || analyzerResults.prices.length === 0) {
        debugPriceDetection('strategy-result', 'dom-analyzer', {
          success: false,
          message: 'No prices found in DOM',
        });
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

      debugPriceDetection('strategy-result', 'dom-analyzer', {
        success: true,
        count: results.length,
        extractionTime: analyzerResults.metadata?.extractionTime,
      });
      return results;
    } catch (error) {
      debugPriceDetection('strategy-result', 'dom-analyzer', {
        success: false,
        error: error.message,
      });
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
    debugPriceDetection('strategy-attempt', 'pattern-matching', {
      textLength: input.text?.length || 0,
    });

    try {
      const patternMatch = selectBestPattern(input.text, context.patternContext);

      if (!patternMatch) {
        debugPriceDetection('strategy-result', 'pattern-matching', {
          success: false,
          message: 'No pattern match found',
        });
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

      debugPriceDetection('strategy-result', 'pattern-matching', {
        success: true,
        pattern: patternMatch.pattern,
        confidence: result.confidence,
      });
      return [result];
    } catch (error) {
      debugPriceDetection('strategy-result', 'pattern-matching', {
        success: false,
        error: error.message,
      });
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
          debugPriceDetection('pipeline-strategy', 'strategy-skip', {
            strategy: strategy.name,
            reason: 'cannot handle input',
          });
          continue;
        }

        // Skip specific strategies if excluded
        if (options.excludeStrategies?.includes(strategy.name)) {
          debugPriceDetection('pipeline-strategy', 'strategy-skip', {
            strategy: strategy.name,
            reason: 'excluded by options',
          });
          continue;
        }

        processedStrategies.push(strategy.name);
        const strategyResults = await Promise.resolve(strategy.extract(input, context));

        if (strategyResults && strategyResults.length > 0) {
          results.push(...strategyResults);

          // Early exit if high-confidence result found
          if (this.shouldEarlyExit(results, options)) {
            debugPriceDetection('pipeline-complete', 'early-exit', {
              reason: 'high confidence result found',
              resultCount: results.length,
            });
            break;
          }
        }
      } catch (error) {
        logger.error(`Error in ${strategy.name} strategy:`, error);
        // Continue with next strategy
      }
    }

    debugPriceDetection('pipeline-complete', 'extraction-complete', {
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

/**
 * Multi-Pass Strategy Classes
 * Each pass represents a different extraction approach with increasing scope
 */

/**
 * Pass 1: Site-Specific Handler Pass
 */
const siteSpecificPass = {
  name: 'site-specific',
  priority: 1,

  canHandle(input) {
    return input.element && getHandlerForCurrentSite() !== null;
  },

  async extract(input, context) {
    return siteSpecificStrategy.extract(input, context);
  },
};

/**
 * Pass 2: DOM Attribute Extraction Pass
 */
const attributeExtractionPass = {
  name: 'attribute-extraction',
  priority: 2,

  canHandle(input) {
    return !!input.element;
  },

  // eslint-disable-next-line no-unused-vars
  async extract(input, _context) {
    debugPriceDetection('strategy-attempt', 'attribute-extraction', {
      elementType: input.element?.tagName,
    });

    try {
      const prices = extractFromAttributes(input.element) || [];

      if (!Array.isArray(prices)) {
        return [];
      }

      return prices.map((price) => ({
        value: price.value,
        currency: price.currency,
        text: price.text,
        confidence: price.confidence || 0.9,
        strategy: this.name,
        metadata: {
          source: price.source,
          extractionMethod: 'attribute',
        },
      }));
    } catch (error) {
      debugPriceDetection('strategy-result', 'attribute-extraction', {
        success: false,
        error: error.message,
      });
      return [];
    }
  },
};

/**
 * Pass 3: DOM Structure Analysis Pass
 */
const structureAnalysisPass = {
  name: 'structure-analysis',
  priority: 3,

  canHandle(input) {
    return !!input.element;
  },

  async extract(input, context) {
    debugPriceDetection('strategy-attempt', 'structure-analysis', {
      elementType: input.element?.tagName,
    });

    try {
      const allPrices = [];

      // Get element context for enhanced analysis
      const elementContext = getElementContext(input.element, context.options) || {
        confidence: 0,
        priceIndicators: { hasParentContainer: false },
        semantics: { containerType: null, priceType: null },
      };
      debugPriceDetection('strategy-context', 'element-analysis', {
        confidence: elementContext.confidence,
        hasParentContainer: elementContext.priceIndicators?.hasParentContainer,
        containerType: elementContext.semantics?.containerType,
      });

      // Split components analysis
      const splitPrices = assembleSplitComponents(input.element, context.options) || [];
      if (Array.isArray(splitPrices)) {
        allPrices.push(...splitPrices);
      }

      // Nested currency analysis
      const nestedPrices = extractNestedCurrency(input.element) || [];
      if (Array.isArray(nestedPrices)) {
        allPrices.push(...nestedPrices);
      }

      // Context-enhanced extraction for high-confidence elements
      if (elementContext.confidence > 0.7) {
        debugPriceDetection('strategy-context', 'enhanced-extraction', {
          elementConfidence: elementContext.confidence,
        });

        // Apply context-based confidence boost
        const contextBoost = Math.min(0.2, elementContext.confidence * 0.2);

        return allPrices.map((price) => ({
          value: price.value,
          currency: price.currency,
          text: price.text,
          confidence: Math.min(0.95, (price.confidence || 0.85) + contextBoost),
          strategy: this.name,
          metadata: {
            source: price.source || 'structure-analysis',
            extractionMethod: price.strategy || 'structure',
            contextData: {
              elementConfidence: elementContext.confidence,
              containerType: elementContext.semantics.containerType,
              priceType: elementContext.semantics.priceType,
              hasParentContainer: elementContext.priceIndicators.hasParentContainer,
            },
          },
        }));
      }

      return allPrices.map((price) => ({
        value: price.value,
        currency: price.currency,
        text: price.text,
        confidence: price.confidence || 0.85,
        strategy: this.name,
        metadata: {
          source: price.source || 'structure-analysis',
          extractionMethod: price.strategy || 'structure',
          contextData: {
            elementConfidence: elementContext.confidence,
            containerType: elementContext.semantics.containerType,
          },
        },
      }));
    } catch (error) {
      debugPriceDetection('strategy-result', 'structure-analysis', {
        success: false,
        error: error.message,
      });
      return [];
    }
  },
};

/**
 * Pass 4: Enhanced Pattern Matching Pass
 */
const patternMatchingPass = {
  name: 'pattern-matching',
  priority: 4,

  canHandle(input) {
    return !!input.text;
  },

  async extract(input, context) {
    return patternMatchingStrategy.extract(input, context);
  },
};

/**
 * Pass 5: Contextual Patterns Pass
 */
const contextualPatternsPass = {
  name: 'contextual-patterns',
  priority: 5,

  canHandle(input) {
    return !!input.text || !!input.element;
  },

  // eslint-disable-next-line no-unused-vars
  async extract(input, _context) {
    debugPriceDetection('strategy-attempt', 'contextual-patterns', {
      inputType: input.element ? 'element' : 'text',
    });

    try {
      // Handle element input
      if (input.element) {
        const prices = extractContextualPrices(input.element) || [];

        if (!Array.isArray(prices)) {
          return [];
        }

        return prices.map((price) => ({
          value: price.value,
          currency: price.currency,
          text: price.text,
          confidence: price.confidence || 0.7,
          strategy: this.name,
          metadata: {
            source: price.source || 'contextual',
            context: price.context,
            extractionMethod: 'contextual',
          },
        }));
      }

      // Handle text-only input by creating a temporary element
      if (input.text) {
        const tempElement = document.createElement('div');
        tempElement.textContent = input.text;

        const prices = extractContextualPrices(tempElement) || [];

        if (!Array.isArray(prices)) {
          return [];
        }

        return prices.map((price) => ({
          value: price.value,
          currency: price.currency,
          text: price.text,
          confidence: price.confidence || 0.7,
          strategy: this.name,
          metadata: {
            source: price.source || 'contextual',
            context: price.context,
            extractionMethod: 'contextual',
          },
        }));
      }

      return [];
    } catch (error) {
      debugPriceDetection('strategy-result', 'contextual-patterns', {
        success: false,
        error: error.message,
      });
      return [];
    }
  },
};

/**
 * Multi-Pass Pipeline Class
 * Extends the base ExtractionPipeline to support explicit pass execution
 */
class MultiPassPipeline extends ExtractionPipeline {
  constructor() {
    const passes = [
      siteSpecificPass,
      attributeExtractionPass,
      structureAnalysisPass,
      patternMatchingPass,
      contextualPatternsPass,
    ];
    super(passes);
  }

  /**
   * Execute multi-pass extraction with enhanced logging and control
   *
   * @param {object} input - Input data
   * @param {object} options - Extraction options
   * @returns {Promise<Array>} Extracted prices
   */
  async extract(input, options = {}) {
    if (options.multiPassMode) {
      return this.executeMultiPassDetection(input, options);
    }
    return super.extract(input, options);
  }

  /**
   * Execute explicit multi-pass detection
   *
   * @param {object} input - Input data
   * @param {object} options - Extraction options
   * @returns {Promise<Array>} Extracted prices
   */
  async executeMultiPassDetection(input, options) {
    const context = this.prepareContext(input, options);
    const results = [];
    const passResults = [];

    // Filter passes if onlyPass option is specified
    let passesToRun = this.strategies;
    if (options.onlyPass) {
      passesToRun = this.strategies.filter((pass) => pass.name === options.onlyPass);
      if (passesToRun.length === 0) {
        debugPriceDetection('pipeline-error', 'invalid-pass', { requestedPass: options.onlyPass });
        return [];
      }
    }

    for (let i = 0; i < passesToRun.length; i++) {
      const pass = passesToRun[i];

      try {
        debugPriceDetection('pipeline-start', 'pass-start', {
          passName: pass.name,
          passNumber: i + 1,
          totalPasses: passesToRun.length,
          canHandle: pass.canHandle(input),
        });

        // Skip passes that can't handle this input
        if (!pass.canHandle(input)) {
          debugPriceDetection('pipeline-skip', 'pass-skip', {
            passName: pass.name,
            reason: 'cannot handle input',
          });
          continue;
        }

        const passResult = await Promise.resolve(pass.extract(input, context));
        passResults.push({ pass: pass.name, results: passResult });

        debugPriceDetection('pipeline-result', 'pass-complete', {
          passName: pass.name,
          resultCount: passResult.length,
          confidence: passResult.map((r) => r.confidence),
        });

        if (passResult && passResult.length > 0) {
          results.push(...passResult);

          // Check for early termination
          if (this.shouldTerminateAfterPass(results, options)) {
            debugPriceDetection('pipeline-complete', 'early-termination', {
              totalResults: results.length,
            });
            break;
          }
        }
      } catch (error) {
        logger.error(`Error in ${pass.name} pass:`, error);
        debugPriceDetection('pipeline-error', 'pass-failed', {
          passName: pass.name,
          error: error.message,
        });
        // Continue with next pass
      }
    }

    debugPriceDetection('pipeline-complete', 'multi-pass-complete', {
      totalResults: results.length,
      passesExecuted: passResults.map((p) => p.pass),
    });

    return this.processResults(results, options);
  }

  /**
   * Check if pipeline should terminate after current pass
   *
   * @param {Array} results - Current results
   * @param {object} options - Extraction options
   * @returns {boolean} True if should terminate
   */
  shouldTerminateAfterPass(results, options) {
    if (options.exhaustive || options.returnMultiple) {
      return false;
    }

    // Terminate if we have a high-confidence result
    const highConfidenceThreshold = options.earlyExitConfidence || 0.9;
    return results.some((result) => result.confidence >= highConfidenceThreshold);
  }
}

// Default pipeline instance
let defaultPipeline = null;
let multiPassPipeline = null;

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
 * Get or create the multi-pass pipeline
 *
 * @returns {MultiPassPipeline} Multi-pass pipeline instance
 */
function getMultiPassPipeline() {
  if (!multiPassPipeline) {
    multiPassPipeline = new MultiPassPipeline();
  }
  return multiPassPipeline;
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
  const startTime = Date.now();

  try {
    // Normalize input
    const normalizedInput = normalizeInput(input);

    if (!normalizedInput.element && !normalizedInput.text) {
      debugPriceDetection('pipeline-start', 'invalid-input', {
        hasElement: !!normalizedInput.element,
        hasText: !!normalizedInput.text,
      });
      return options.returnMultiple ? [] : null;
    }

    // Log pipeline start
    debugPriceDetection('pipeline-start', 'extraction-start', {
      hasElement: !!normalizedInput.element,
      hasText: !!normalizedInput.text,
      textLength: normalizedInput.text?.length || 0,
      elementType: normalizedInput.element?.tagName,
      multiPassMode: !!options.multiPassMode,
      returnMultiple: !!options.returnMultiple,
    });

    // Get or create pipeline
    const pipeline =
      options.pipeline || (options.multiPassMode ? getMultiPassPipeline() : getDefaultPipeline());

    // Extract prices
    const results = await pipeline.extract(normalizedInput, options);

    // Log pipeline completion
    const endTime = Date.now();
    debugPriceDetection(
      'pipeline-complete',
      'extraction-complete',
      {
        resultCount: results.length,
        duration: endTime - startTime,
        pipelineType: options.multiPassMode ? 'multi-pass' : 'default',
      },
      {
        start: startTime,
        end: endTime,
        duration: endTime - startTime,
      }
    );

    // Return based on options
    if (options.returnMultiple) {
      return results;
    }

    return results[0] || null;
  } catch (error) {
    const endTime = Date.now();
    debugPriceDetection(
      'pipeline-error',
      'extraction-failed',
      {
        error: error.message,
        duration: endTime - startTime,
      },
      {
        start: startTime,
        end: endTime,
        duration: endTime - startTime,
      }
    );

    logger.error('Error in extractPrice:', error);
    return options.returnMultiple ? [] : null;
  }
}
