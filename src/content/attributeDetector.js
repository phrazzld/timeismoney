/**
 * Price Attribute Detector module
 *
 * Provides enhanced detection of price elements based on common attributes,
 * class patterns, and DOM structure analysis. This module works alongside
 * site-specific handlers like amazonHandler and ebayHandler, but provides
 * more general-purpose attribute-based detection.
 *
 * @module content/attributeDetector
 */

import * as logger from '../utils/logger.js';
import * as debugTools from './debugTools.js';

/**
 * Common price-related attributes that often contain price values
 * or indicate an element is a price container
 */
export const PRICE_ATTRIBUTES = [
  'data-price',
  'data-amount',
  'data-value',
  'data-cost',
  'data-currency-value',
  'data-price-value',
  'data-product-price',
  'data-sale-price',
  'data-regular-price',
  'data-original-price',
  'data-current-price',
  'data-raw-price',
  'itemprops', // For microdata item properties
  'itemprop', // Standard microdata attributes
];

/**
 * Common classes that often indicate price elements
 */
export const PRICE_CLASSES = [
  'price',
  'product-price',
  'sale-price',
  'current-price',
  'discounted-price',
  'regular-price',
  'original-price',
  'final-price',
  'amount',
  'cost',
  'value',
  'pricenow',
  'price--withoutTax',
  'price--withTax',
  'price-money',
  'money',
  'currency',
];

/**
 * Common parent classes that often contain price elements
 */
export const PRICE_CONTAINERS = [
  'prices',
  'price-container',
  'product-prices',
  'pricing',
  'price-box',
  'price-info',
  'price-wrapper',
  'price-section',
];

/**
 * Checks if the element has any price-related attributes
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if the element has price-related attributes
 */
const hasPriceAttributes = (element) => {
  if (!element || !element.hasAttribute) return false;

  // Check for any price-related attributes
  for (const attr of PRICE_ATTRIBUTES) {
    if (element.hasAttribute(attr)) {
      return true;
    }
  }

  // Check for itemprop="price" specifically
  if (
    element.hasAttribute('itemprop') &&
    element.getAttribute('itemprop').toLowerCase().includes('price')
  ) {
    return true;
  }

  return false;
};

/**
 * Checks if the element has any price-related classes
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if the element has price-related classes
 */
const hasPriceClasses = (element) => {
  if (!element || !element.classList) return false;

  // Check for exact matches on price-related classes
  for (const className of PRICE_CLASSES) {
    if (element.classList.contains(className)) {
      return true;
    }
  }

  // Check for classes containing price-related terms
  const elementClassString = Array.from(element.classList).join(' ').toLowerCase();
  const priceTerms = ['price', 'cost', 'amount', 'value', 'money', 'currency'];

  for (const term of priceTerms) {
    if (elementClassString.includes(term)) {
      return true;
    }
  }

  return false;
};

/**
 * Checks if the element is inside a price container
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if the element is inside a price container
 */
const isInPriceContainer = (element) => {
  if (!element || !element.closest) return false;

  // Check if element's parent has price container classes
  for (const containerClass of PRICE_CONTAINERS) {
    if (element.closest(`.${containerClass}`)) {
      return true;
    }
  }

  // Check for parent elements with price-related terms in their class names
  const parent = element.parentElement;
  if (parent && parent.classList) {
    const parentClassString = Array.from(parent.classList).join(' ').toLowerCase();
    const containerTerms = ['price', 'pricing', 'cost', 'amount'];

    for (const term of containerTerms) {
      if (parentClassString.includes(term)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks if an element's text contains potential price content
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if the element's text looks like a price
 */
const hasPriceContent = (element) => {
  if (!element) return false;

  const text = element.textContent || '';

  // Skip empty or very short text
  if (text.trim().length < 2) return false;

  // Check for currency symbols followed by numbers
  if (/[$€£¥₹₽¢]\s*\d/.test(text)) {
    return true;
  }

  // Check for numbers followed by currency codes or symbols
  if (
    /\d+(\.\d+)?\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|HKD|NZD|SEK|KRW|SGD|NOK|MXN|INR|RUB|ZAR|BRL|[$€£¥₹₽¢])/.test(
      text
    )
  ) {
    return true;
  }

  // Check for potential prices - numbers with 2 decimal places, dollar format
  // But ensure text is not too long to avoid non-price content
  if (/\d+\.\d{2}/.test(text) && text.length < 20) {
    return true;
  }

  return false;
};

/**
 * Checks if an element is likely a price element based on its attributes,
 * classes, content, and structural position in the DOM
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if the element is likely a price element
 */
export const isPriceElement = (element) => {
  if (!element || element.nodeType !== 1) return false;

  // First, check for price-related attributes which are the strongest signals
  if (hasPriceAttributes(element)) {
    return true;
  }

  // Next, check for price-related classes
  if (hasPriceClasses(element)) {
    // If it has price classes, also check if it contains price-like content
    if (hasPriceContent(element)) {
      return true;
    }
  }

  // Check if it's inside a price container and has numeric content
  if (isInPriceContainer(element) && /\d/.test(element.textContent || '')) {
    return true;
  }

  return false;
};

/**
 * Finds all text nodes within an element that contain price-like content
 *
 * @param {Element} element - The element to search within
 * @returns {Node[]} Array of text nodes containing price-like content
 */
export const findPriceTextNodes = (element) => {
  if (!element) return [];

  const textNodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);

  let textNode;
  while ((textNode = walker.nextNode())) {
    const text = textNode.nodeValue || '';

    // Skip empty text nodes or very short ones
    if (text.trim().length < 2) continue;

    // Check for currency symbols and numbers
    if (
      (/[$€£¥₹₽¢]/.test(text) && /\d/.test(text)) || // Has currency symbol and number
      (/\d+\.\d{2}/.test(text) && text.length < 20)
    ) {
      // Looks like a price (eg 19.99)
      textNodes.push(textNode);
    }
  }

  return textNodes;
};

/**
 * Detects and extracts price information from composite price structures where
 * the price might be split across multiple elements or text nodes
 *
 * @param {Element} element - Price element to analyze
 * @returns {Node[]} Array of text nodes containing price information
 */
export const extractCompositePriceNodes = (element) => {
  // First try to find individual price text nodes
  const directPriceNodes = findPriceTextNodes(element);

  // If we found direct text nodes with price content, return them
  if (directPriceNodes.length > 0) {
    return directPriceNodes;
  }

  // Otherwise, try to handle composite price structures where price
  // components might be split across multiple elements

  // Look for small child elements that might contain parts of a price
  const priceFragments = [];
  const children = element.children;

  // Composite price patterns often include these classes
  const compositePriceClasses = [
    'currency',
    'symbol',
    'whole',
    'fraction',
    'cents',
    'dollars',
    'amount',
    'integer',
    'decimal',
  ];

  // Check all immediate children
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    // Skip if the child element itself is a complex structure
    if (child.children.length > 2) continue;

    // Check if class name contains any price component terms
    const childClass = Array.from(child.classList || [])
      .join(' ')
      .toLowerCase();

    const hasCompositePriceClass = compositePriceClasses.some((cls) => childClass.includes(cls));

    if (hasCompositePriceClass) {
      // For composite price structures, often the text is exactly what we need even if it doesn't
      // have obvious currency markers, so get direct text nodes
      if (child.childNodes.length > 0) {
        for (let j = 0; j < child.childNodes.length; j++) {
          if (child.childNodes[j].nodeType === 3 && child.childNodes[j].nodeValue.trim()) {
            priceFragments.push(child.childNodes[j]);
          }
        }
      }
    }
  }

  // If we still found no fragments, try a more aggressive approach for deeper structures
  if (priceFragments.length === 0 && hasPriceContent(element)) {
    // Get all text nodes within this element regardless of structure
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (textNode.nodeValue.trim()) {
        // Only add non-empty text nodes
        priceFragments.push(textNode);
      }
    }
  }

  return priceFragments;
};

/**
 * Main entry point for attribute-based price detection
 * Processes a node if it's likely a price element, applies callback to price text nodes
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to price text nodes
 * @param {Node} callback.textNode - Text node containing the price (passed to callback)
 * @param {object} callback.settings - The current extension settings (passed by domScanner)
 * @param {object} settings - The current extension settings
 * @returns {boolean} True if node was handled as a price element,
 *                    false if the node is not a price element or processing failed
 */
export const processElementAttributes = (node, callback, settings) => {
  try {
    // Skip if not an element node
    if (!node || node.nodeType !== 1) return false;

    // Check if this is a price element
    if (!isPriceElement(node)) {
      return false;
    }

    // Debug logging if enabled
    if (settings?.debugMode) {
      debugTools.debugState.addLogEntry('info', 'Attribute-based price element detected', {
        element: node.outerHTML?.substring(0, 100) || 'Unknown element',
      });
    }

    // Find all price text nodes
    let priceTextNodes = findPriceTextNodes(node);

    // If no direct price text nodes found, try to extract from composite structure
    if (priceTextNodes.length === 0) {
      priceTextNodes = extractCompositePriceNodes(node);
    }

    // Debug logging if enabled
    if (settings?.debugMode) {
      debugTools.debugState.addLogEntry(
        'info',
        `Found ${priceTextNodes.length} potential price text nodes via attribute detection`,
        {
          elementHTML: node.outerHTML.substring(0, 100),
        }
      );
    }

    // Process found text nodes
    if (priceTextNodes.length > 0) {
      let processed = false;

      // Process each text node with the callback
      for (const textNode of priceTextNodes) {
        try {
          callback(textNode, settings);
          processed = true;

          // If in debug mode, mark as successfully processed
          if (settings?.debugMode) {
            const nodeElement = textNode.parentElement;
            if (nodeElement) {
              debugTools.markConversionSuccess(
                nodeElement,
                textNode.nodeValue,
                'Processed by attribute detector'
              );
            }
          }
        } catch (textNodeError) {
          logger.error('Error processing attribute price text node:', textNodeError.message);
        }
      }

      return processed;
    }

    return false;
  } catch (error) {
    logger.error('Error in attribute price detector:', error.message, error.stack);
    return false;
  }
};
