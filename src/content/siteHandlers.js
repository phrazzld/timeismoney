/**
 * Site-Specific Handlers Module
 * Provides a unified registry for site-specific price extraction handlers
 *
 * @module content/siteHandlers
 */

import * as logger from '../utils/logger.js';
import { extractPricesFromElement } from './domPriceAnalyzer.js';
import { matchSplitComponents } from './pricePatterns.js';

/**
 * Registry for site-specific handlers
 * Maps domain names to handler objects
 */
export const SITE_HANDLERS = new Map();

/**
 * Register a site handler
 *
 * @param {object} handler - Handler object with name, domains, process, and isTargetNode
 */
export function registerHandler(handler) {
  if (!handler || !handler.domains || !Array.isArray(handler.domains)) {
    logger.error('Invalid handler registration:', handler);
    return;
  }

  handler.domains.forEach((domain) => {
    SITE_HANDLERS.set(domain, handler);
  });
}

/**
 * Clear all registered handlers (mainly for testing)
 */
export function clearHandlers() {
  SITE_HANDLERS.clear();
}

/**
 * Get the current domain without www prefix
 *
 * @returns {string} Current domain name
 */
function getCurrentDomain() {
  return window.location.hostname.replace('www.', '');
}

/**
 * Get handler for the current site
 *
 * @returns {object|null} Handler object or null if no handler registered
 */
export function getHandlerForCurrentSite() {
  const domain = getCurrentDomain();
  return SITE_HANDLERS.get(domain) || null;
}

/**
 * Process a node with the appropriate site handler
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to price text nodes
 * @param {object} settings - Extension settings
 * @returns {boolean} True if processed by a handler, false otherwise
 */
export function processWithSiteHandler(node, callback, settings) {
  const handler = getHandlerForCurrentSite();

  if (!handler) {
    return false;
  }

  try {
    return handler.process(node, callback, settings);
  } catch (error) {
    logger.error(`Error in ${handler.name} handler:`, error);
    return false;
  }
}

/**
 * Cdiscount Handler
 * Handles Cdiscount's unique price formats including "449€ 00" split format
 */
export const cdiscountHandler = {
  name: 'cdiscount',
  domains: ['cdiscount.com', 'cdiscount.fr'],

  /**
   * Check if node is a Cdiscount price element
   *
   * @param {Node} node - DOM node to check
   * @returns {boolean} True if node is a Cdiscount price element
   */
  isTargetNode(node) {
    if (!node || node.nodeType !== 1) return false;

    const classList = node.classList;
    if (!classList) return false;

    // Check for known Cdiscount price classes
    return (
      classList.contains('price') ||
      classList.contains('fpPrice') ||
      classList.contains('c-price') ||
      (node.querySelector &&
        (node.querySelector('.price') ||
          node.querySelector('.fpPrice') ||
          node.querySelector('.c-price'))) ||
      false
    );
  },

  /**
   * Process Cdiscount price node
   *
   * @param {Node} node - DOM node to process
   * @param {Function} callback - Callback function for price text nodes
   * @returns {boolean} True if price was processed
   */
  process(node, callback) {
    if (!this.isTargetNode(node)) {
      return false;
    }

    try {
      // Strategy 1: Check for split format (449€ 00)
      const splitMatch = this.extractSplitFormat(node);
      if (splitMatch) {
        const textNode = document.createTextNode(splitMatch);
        callback(textNode);
        return true;
      }

      // Strategy 2: Check for superscript components
      const superscriptMatch = this.extractSuperscriptFormat(node);
      if (superscriptMatch) {
        const textNode = document.createTextNode(superscriptMatch);
        callback(textNode);
        return true;
      }

      // Strategy 3: Use DOM analyzer for complex structures
      const analyzerResults = extractPricesFromElement(node);
      if (analyzerResults.prices.length > 0) {
        analyzerResults.prices.forEach((price) => {
          const textNode = document.createTextNode(price.text);
          callback(textNode);
        });
        return true;
      }

      // Strategy 4: Simple text content
      const textContent = node.textContent.trim();
      if (textContent && /\d/.test(textContent) && /€/.test(textContent)) {
        const textNode = document.createTextNode(textContent);
        callback(textNode);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error in Cdiscount handler:', error);
      return false;
    }
  },

  /**
   * Extract split format prices like "449€ 00"
   *
   * @param {Node} node - DOM node to extract from
   * @returns {string|null} Extracted price string or null
   */
  extractSplitFormat(node) {
    const text = node.textContent || '';

    // Look for pattern like "449€ 00"
    const splitMatch = text.match(/(\d+)€\s+(\d{2})/);
    if (splitMatch) {
      return `${splitMatch[1]}€ ${splitMatch[2]}`;
    }

    // Check child elements for split components
    const children = Array.from(node.children || []);
    if (children.length >= 2) {
      const parts = children.map((child) => child.textContent.trim());
      const splitResults = matchSplitComponents(parts);
      if (splitResults.length > 0) {
        return splitResults[0].reconstructed;
      }
    }

    return null;
  },

  /**
   * Extract superscript format prices
   *
   * @param {Node} node - DOM node to extract from
   * @returns {string|null} Extracted price string or null
   */
  extractSuperscriptFormat(node) {
    const spans = node.querySelectorAll('span');
    if (spans.length >= 3) {
      const parts = Array.from(spans).map((span) => span.textContent.trim());

      // Check for pattern like ["129", "€", "95"]
      if (
        parts.length === 3 &&
        /^\d+$/.test(parts[0]) &&
        /^[€£$]$/.test(parts[1]) &&
        /^\d{2}$/.test(parts[2])
      ) {
        return `${parts[0]}${parts[1]}${parts[2]}`;
      }
    }

    return null;
  },
};

/**
 * Gearbest Handler
 * Handles Gearbest's nested currency spans and US$ prefix format
 */
export const gearbestHandler = {
  name: 'gearbest',
  domains: ['gearbest.com', 'gearbest.ma'],

  /**
   * Check if node is a Gearbest price element
   *
   * @param {Node} node - DOM node to check
   * @returns {boolean} True if node is a Gearbest price element
   */
  isTargetNode(node) {
    if (!node || node.nodeType !== 1) return false;

    const classList = node.classList;
    if (!classList) return false;

    // Check for known Gearbest price classes
    return (
      classList.contains('goods-price') ||
      classList.contains('my-shop-price') ||
      classList.contains('woocommerce-Price-amount') ||
      (node.querySelector &&
        (node.querySelector('.goods-price') || node.querySelector('.woocommerce-Price-amount'))) ||
      false
    );
  },

  /**
   * Process Gearbest price node
   *
   * @param {Node} node - DOM node to process
   * @param {Function} callback - Callback function for price text nodes
   * @returns {boolean} True if price was processed
   */
  process(node, callback) {
    if (!this.isTargetNode(node)) {
      return false;
    }

    try {
      // Strategy 1: Check for nested currency spans
      const nestedMatch = this.extractNestedCurrency(node);
      if (nestedMatch) {
        const textNode = document.createTextNode(nestedMatch);
        callback(textNode);
        return true;
      }

      // Strategy 2: Check for WooCommerce structure
      const wooMatch = this.extractWooCommerceFormat(node);
      if (wooMatch) {
        const textNode = document.createTextNode(wooMatch);
        callback(textNode);
        return true;
      }

      // Strategy 3: Use DOM analyzer for complex structures
      const analyzerResults = extractPricesFromElement(node);
      if (analyzerResults.prices.length > 0) {
        analyzerResults.prices.forEach((price) => {
          const textNode = document.createTextNode(price.text);
          callback(textNode);
        });
        return true;
      }

      // Strategy 4: Simple text content (handles US$ prefix)
      const textContent = node.textContent.trim();
      if (
        textContent &&
        /\d/.test(textContent) &&
        (/\$/.test(textContent) || /US\$/.test(textContent))
      ) {
        const textNode = document.createTextNode(textContent);
        callback(textNode);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error in Gearbest handler:', error);
      return false;
    }
  },

  /**
   * Extract nested currency format
   *
   * @param {Node} node - DOM node to extract from
   * @returns {string|null} Extracted price string or null
   */
  extractNestedCurrency(node) {
    const currencySpan = node.querySelector('.currency');
    const valueSpan = node.querySelector('.value');

    if (currencySpan && valueSpan) {
      const currency = currencySpan.textContent.trim();
      const value = valueSpan.textContent.trim();
      return `${currency}${value}`;
    }

    return null;
  },

  /**
   * Extract WooCommerce format prices
   *
   * @param {Node} node - DOM node to extract from
   * @returns {string|null} Extracted price string or null
   */
  extractWooCommerceFormat(node) {
    const bdi = node.querySelector('bdi');
    if (bdi) {
      const text = bdi.textContent.trim();
      // WooCommerce format has currency symbol as child span
      if (text && /\d/.test(text)) {
        return text;
      }
    }

    return null;
  },
};

/**
 * Register existing Amazon and eBay handlers as adapters
 */
export function registerExistingHandlers() {
  // Dynamic imports to avoid circular dependencies
  import('./amazonHandler.js')
    .then(({ processIfAmazon, isAmazonPriceNode }) => {
      const amazonAdapter = {
        name: 'amazon',
        domains: ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr'],
        isTargetNode: (node) => !!isAmazonPriceNode(node),
        process: (node, callback) => {
          return processIfAmazon(node, callback);
        },
      };
      registerHandler(amazonAdapter);
    })
    .catch((error) => {
      logger.error('Failed to register Amazon handler:', error);
    });

  import('./ebayHandler.js')
    .then(({ processIfEbay, isEbayPriceNode }) => {
      const ebayAdapter = {
        name: 'ebay',
        domains: ['ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr'],
        isTargetNode: (node) => isEbayPriceNode(node),
        process: (node, callback, settings) => {
          return processIfEbay(node, callback, settings);
        },
      };
      registerHandler(ebayAdapter);
    })
    .catch((error) => {
      logger.error('Failed to register eBay handler:', error);
    });
}

// Auto-register handlers on module load
registerHandler(cdiscountHandler);
registerHandler(gearbestHandler);
// Note: Existing handlers registered dynamically to avoid circular dependencies
