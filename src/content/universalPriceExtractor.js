/**
 * Universal Price Extractor
 * Combines all price extraction patterns to work on any website without domain restrictions
 *
 * @module content/universalPriceExtractor
 */

import * as logger from '../utils/logger.js';
import { extractPricesFromElement } from './domPriceAnalyzer.js';
import {
  matchSplitComponents,
  matchContextualPhrases,
  matchSpaceVariations,
} from './pricePatterns.js';
// Note: findPrices is imported but not used - keeping for future integration

/**
 * Simple price extraction using regex patterns
 *
 * @param {string} text - Text to search for prices
 * @returns {Array<string>} Array of price strings found
 */
function extractPriceStrings(text) {
  if (!text) return [];

  const prices = [];
  const patterns = [
    // Standard currency patterns
    /\$\d+(?:[.,]\d+)?/g,
    /€\d+(?:[.,]\d+)?/g,
    /£\d+(?:[.,]\d+)?/g,
    /¥\d+(?:[.,]\d+)?/g,
    /₹\d+(?:[.,]\d+)?/g,
    /₽\d+(?:[.,]\d+)?/g,

    // Currency after number
    /\d+(?:[.,]\d+)?\s*(?:\$|€|£|¥|₹|₽)/g,

    // Currency codes
    /(?:USD|EUR|GBP|JPY|INR|RUB)\s*\d+(?:[.,]\d+)?/g,
    /\d+(?:[.,]\d+)?\s*(?:USD|EUR|GBP|JPY|INR|RUB)/g,

    // US$ format
    /US\$\s*\d+(?:[.,]\d+)?/g,
  ];

  patterns.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      if (!prices.includes(match)) {
        prices.push(match);
      }
    });
  });

  return prices;
}

/**
 * Extract all prices from an element using universal patterns
 *
 * @param {Element} element - DOM element to extract prices from
 * @param {object} settings - Extension settings including currency preferences
 * @returns {Array<{text: string, confidence: number, source: string}>} Array of price objects
 */
export function extractPrices(element, settings) {
  const prices = new Map(); // Use Map to deduplicate by price text

  try {
    // Strategy 1: DOM-based extraction (attributes, nested elements, etc.)
    const domPrices = extractPricesFromElement(element);
    domPrices.prices.forEach((price) => {
      if (!prices.has(price.text)) {
        prices.set(price.text, {
          ...price,
          source: 'dom-analyzer',
        });
      }
    });

    // Strategy 2: Split price components (e.g., "449€ 00")
    const splitPrices = extractSplitPrices(element);
    splitPrices.forEach((price) => {
      if (!prices.has(price.text)) {
        prices.set(price.text, price);
      }
    });

    // Strategy 3: Nested currency elements (e.g., <span>US$</span><span>34.56</span>)
    const nestedPrices = extractNestedCurrencyPrices(element);
    nestedPrices.forEach((price) => {
      if (!prices.has(price.text)) {
        prices.set(price.text, price);
      }
    });

    // Strategy 4: Contextual prices (e.g., "Under $20", "from €2.99")
    const contextualPrices = extractContextualPrices(element);
    contextualPrices.forEach((price) => {
      if (!prices.has(price.text)) {
        prices.set(price.text, price);
      }
    });

    // Strategy 5: Standard pattern matching on text content
    const textContent = element.textContent || '';
    if (textContent.trim()) {
      const textPrices = extractPriceStrings(textContent);
      textPrices.forEach((priceText) => {
        if (!prices.has(priceText)) {
          prices.set(priceText, {
            text: priceText,
            confidence: 1.0,
            source: 'text-pattern',
          });
        }
      });

      // Also check for prices with spaces
      const spacedPrices = matchSpaceVariations(textContent);
      spacedPrices.forEach((priceMatch) => {
        const priceText = priceMatch.original || priceMatch.match;
        if (!prices.has(priceText)) {
          prices.set(priceText, {
            text: priceText,
            confidence: priceMatch.confidence || 0.9,
            source: 'spaced-pattern',
          });
        }
      });
    }

    // Convert Map values to array and filter by currency if settings provided
    let results = Array.from(prices.values());

    if (settings && settings.currencyCode) {
      results = filterByCurrency(results, settings.currencyCode);
    }

    return results;
  } catch (error) {
    logger.error('Error in universal price extraction:', error);
    return [];
  }
}

/**
 * Extract split price formats like "449€ 00"
 *
 * @param {Element} element - DOM element to extract from
 * @returns {Array<{text: string, confidence: number, source: string}>} Array of price objects
 */
export function extractSplitPrices(element) {
  const prices = [];

  try {
    // Check direct text content for split patterns
    const text = element.textContent || '';

    // Pattern for split prices with currency symbol between parts
    const splitPatterns = [
      /(\d+)([€£$¥₹])\s+(\d{2})\b/g, // "449€ 00"
      /(\d+)\s+([€£$¥₹])\s+(\d{2})\b/g, // "449 € 00"
    ];

    splitPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const reconstructed = `${match[1]}${match[2]}${match[3]}`;
        prices.push({
          text: reconstructed,
          confidence: 0.95,
          source: 'split-pattern',
        });
      }
    });

    // Check child elements for split components
    const children = Array.from(element.children || []);
    if (children.length >= 2) {
      const parts = children.map((child) => child.textContent.trim());
      const splitResults = matchSplitComponents(parts);

      splitResults.forEach((result) => {
        prices.push({
          text: result.reconstructed,
          confidence: result.confidence || 0.9,
          source: 'split-elements',
        });
      });
    }

    // Check for superscript/subscript patterns
    const superscriptPrice = extractSuperscriptFormat(element);
    if (superscriptPrice) {
      prices.push({
        text: superscriptPrice,
        confidence: 0.9,
        source: 'superscript-pattern',
      });
    }
  } catch (error) {
    logger.error('Error extracting split prices:', error);
  }

  return prices;
}

/**
 * Extract nested currency format prices
 *
 * @param {Element} element - DOM element to extract from
 * @returns {Array<{text: string, confidence: number, source: string}>} Array of price objects
 */
export function extractNestedCurrencyPrices(element) {
  const prices = [];

  try {
    // Pattern 1: Look for adjacent elements with currency and value
    const allElements = element.querySelectorAll('*');

    for (let i = 0; i < allElements.length - 1; i++) {
      const current = allElements[i];
      const next = allElements[i + 1];

      if (current.nextElementSibling === next) {
        const currentText = current.textContent.trim();
        const nextText = next.textContent.trim();

        // Check if one has currency and other has number
        const currencyPattern = /^(US\$|\$|€|£|¥|₹)$/;
        const numberPattern = /^\d+([.,]\d+)?$/;

        if (currencyPattern.test(currentText) && numberPattern.test(nextText)) {
          prices.push({
            text: currentText + nextText,
            confidence: 0.9,
            source: 'nested-currency',
          });
        } else if (numberPattern.test(currentText) && currencyPattern.test(nextText)) {
          prices.push({
            text: nextText + currentText,
            confidence: 0.9,
            source: 'nested-currency',
          });
        }
      }
    }

    // Pattern 2: Look for specific class patterns (generic, not site-specific)
    const currencyElements = element.querySelectorAll('[class*="currency"], [class*="symbol"]');
    const valueElements = element.querySelectorAll(
      '[class*="value"], [class*="amount"], [class*="price"]'
    );

    currencyElements.forEach((currencyEl) => {
      valueElements.forEach((valueEl) => {
        if (currencyEl.parentElement === valueEl.parentElement) {
          const currency = currencyEl.textContent.trim();
          const value = valueEl.textContent.trim();

          if (/^[US$€£¥₹]+$/.test(currency) && /\\d/.test(value)) {
            prices.push({
              text: currency + value,
              confidence: 0.85,
              source: 'nested-classes',
            });
          }
        }
      });
    });
  } catch (error) {
    logger.error('Error extracting nested currency prices:', error);
  }

  return prices;
}

/**
 * Extract contextual prices like "Under $20", "from €2.99"
 *
 * @param {Element} element - DOM element to extract from
 * @returns {Array<{text: string, confidence: number, source: string}>} Array of price objects
 */
export function extractContextualPrices(element) {
  const prices = [];

  try {
    const text = element.textContent || '';
    const contextualMatches = matchContextualPhrases(text);

    contextualMatches.forEach((match) => {
      // Extract just the price part from contextual matches
      const priceOnly =
        match.currency && match.value
          ? `${match.currency}${match.value}`
          : match.price || match.match || match.original;

      if (priceOnly) {
        prices.push({
          text: priceOnly,
          confidence: match.confidence || 0.8,
          source: 'contextual-pattern',
        });
      }
    });
  } catch (error) {
    logger.error('Error extracting contextual prices:', error);
  }

  return prices;
}

/**
 * Extract superscript format prices
 *
 * @param {Element} element - DOM element to extract from
 * @returns {string|null} Extracted price string or null
 */
function extractSuperscriptFormat(element) {
  try {
    // Look for patterns with 3+ spans that might form a price
    const spans = element.querySelectorAll('span');
    if (spans.length >= 3) {
      const parts = Array.from(spans).map((span) => span.textContent.trim());

      // Check various patterns
      for (let i = 0; i <= parts.length - 3; i++) {
        const [part1, part2, part3] = parts.slice(i, i + 3);

        // Pattern: number, currency, decimals
        if (/^\\d+$/.test(part1) && /^[€£$¥₹]$/.test(part2) && /^\\d{2}$/.test(part3)) {
          return `${part1}${part2}${part3}`;
        }

        // Pattern: currency, number, decimals
        if (/^[€£$¥₹]$/.test(part1) && /^\\d+$/.test(part2) && /^\\d{2}$/.test(part3)) {
          return `${part1}${part2}.${part3}`;
        }
      }
    }
  } catch (error) {
    logger.error('Error extracting superscript format:', error);
  }

  return null;
}

/**
 * Detect the currency of a price string
 *
 * @param {string} priceText - Price text to analyze
 * @returns {string|null} Currency code (USD, EUR, GBP, etc.) or null
 */
export function detectPriceCurrency(priceText) {
  if (!priceText) return null;

  // Currency patterns with their codes
  const currencyPatterns = [
    { pattern: /\$|USD/, code: 'USD' },
    { pattern: /€|EUR/, code: 'EUR' },
    { pattern: /£|GBP/, code: 'GBP' },
    { pattern: /¥|JPY|CNY/, code: 'JPY' }, // Could be JPY or CNY
    { pattern: /₹|INR/, code: 'INR' },
    { pattern: /₽|RUB/, code: 'RUB' },
    { pattern: /¢/, code: 'USD' }, // Cents are USD
  ];

  for (const { pattern, code } of currencyPatterns) {
    if (pattern.test(priceText)) {
      return code;
    }
  }

  return null;
}

/**
 * Filter prices by user's selected currency
 *
 * @param {Array<{text: string}>} prices - Array of price objects
 * @param {string} userCurrency - User's selected currency code
 * @returns {Array} Filtered array containing only prices in user's currency
 */
export function filterByCurrency(prices, userCurrency) {
  if (!userCurrency || !prices || prices.length === 0) {
    return prices;
  }

  return prices.filter((price) => {
    const priceCurrency = detectPriceCurrency(price.text);

    // If we can't detect currency, include it (better to show than hide)
    if (!priceCurrency) {
      logger.debug(`Could not detect currency for price: ${price.text}`);
      return true;
    }

    // Only include prices matching user's currency
    const matches = priceCurrency === userCurrency;
    if (!matches) {
      logger.debug(
        `Filtering out ${price.text} (${priceCurrency}) - user currency is ${userCurrency}`
      );
    }

    return matches;
  });
}

/**
 * Process a node with universal price extraction
 * This is the main entry point for DOM scanner integration
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to price text nodes
 * @param {object} settings - Extension settings
 * @returns {boolean} True if any prices were found and processed
 */
export function processWithUniversalExtractor(node, callback, settings) {
  if (!node || node.nodeType !== 1) {
    return false;
  }

  try {
    const prices = extractPrices(node, settings);

    if (prices.length > 0) {
      // Process each found price through the callback
      prices.forEach((price) => {
        const textNode = document.createTextNode(price.text);
        callback(textNode);
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error in universal price processor:', error);
    return false;
  }
}

/**
 * Extract prices from a text node directly
 * Useful for processing text nodes in the DOM walker
 *
 * @param {string} text - Text content to extract prices from
 * @param {object} settings - Extension settings
 * @returns {Array<{text: string, confidence: number}>} Array of price objects
 */
export function extractPricesFromTextNode(text, settings) {
  if (!text || !text.trim()) {
    return [];
  }

  const prices = [];

  // Use all our pattern matching strategies
  const standardPrices = extractPriceStrings(text);
  standardPrices.forEach((priceText) => {
    prices.push({
      text: priceText,
      confidence: 1.0,
    });
  });

  const spacedPrices = matchSpaceVariations(text);
  spacedPrices.forEach((match) => {
    prices.push({
      text: match.original || match.match,
      confidence: match.confidence || 0.9,
    });
  });

  const contextualPrices = matchContextualPhrases(text);
  contextualPrices.forEach((match) => {
    const priceOnly =
      match.currency && match.value
        ? `${match.currency}${match.value}`
        : match.price || match.match || match.original;

    if (priceOnly) {
      prices.push({
        text: priceOnly,
        confidence: match.confidence || 0.8,
      });
    }
  });

  // Filter by currency if settings provided
  if (settings && settings.currencyCode) {
    return filterByCurrency(prices, settings.currencyCode);
  }

  return prices;
}
