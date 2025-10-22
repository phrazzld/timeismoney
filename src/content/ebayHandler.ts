/**
 * eBay Price Handler module
 *
 * Handles eBay-specific price element structures by identifying price elements
 * using various class patterns and attributes used across eBay's website.
 *
 * @module content/ebayHandler
 */

import {
  EBAY_PRICE_CLASSES,
  EBAY_PRICE_CONTAINERS,
  EBAY_PRICE_ATTRIBUTES,
} from '../utils/constants.js';
import * as logger from '../utils/logger.js';
import * as debugTools from './debugTools.js';

/**
 * Settings interface
 */
interface Settings {
  debugMode?: boolean;
  [key: string]: any;
}

/**
 * Checks if a DOM node is an eBay price element
 * eBay uses several different class patterns for price elements
 *
 * @param {Node} node - DOM node to check
 * @returns {boolean} True if node is an eBay price element
 */
export const isEbayPriceNode = (node: Node): boolean => {
  // Must be an element node with classList
  if (!node || !(node as Element).classList || node.nodeType !== 1) return false;

  const element = node as Element;

  // Check for direct price class matches
  for (const className of EBAY_PRICE_CLASSES) {
    if (element.classList.contains(className)) {
      return true;
    }
  }

  // Check if element has any of the price-related attributes
  for (const attribute of EBAY_PRICE_ATTRIBUTES) {
    if (element.hasAttribute(attribute)) {
      return true;
    }
  }

  // Check if element is inside a known price container
  for (const containerSelector of EBAY_PRICE_CONTAINERS) {
    if (element.matches(containerSelector) || element.closest(containerSelector)) {
      // Also check if it contains any numeric content that might be a price
      const text = element.textContent || '';
      const hasPotentialPrice =
        /\d+(\.\d+)?/.test(text) && (/[$€£¥₹₽¢]/.test(text) || text.length < 20);

      if (hasPotentialPrice) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Processes an eBay price element and extracts the price information
 * Finds the text node containing the price and applies the callback
 *
 * @param {Node} node - eBay price element to process
 * @param {Function} callback - Callback function to apply to the price text node
 * @param {Settings} settings - The current extension settings
 * @returns {boolean} True if node was successfully processed as an eBay price element
 */
export const handleEbayPrice = (
  node: Node,
  callback: (textNode: Node) => void,
  settings: Settings
): boolean => {
  if (!node || node.nodeType !== 1) return false;

  const element = node as Element;

  try {
    // Find the actual text node containing the price
    // First, look for text content with currency symbols
    const textNodes: Node[] = [];
    const walkTextNodes = (element: Element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let textNode: Node | null;
      while ((textNode = walker.nextNode())) {
        const text = textNode.nodeValue || '';
        if (
          text.trim() !== '' &&
          /\d+(\.\d+)?/.test(text) &&
          (/[$€£¥₹₽¢]/.test(text) || text.length < 20)
        ) {
          textNodes.push(textNode);
        }
      }
    };

    walkTextNodes(element);

    // Debug logging if enabled
    if (settings?.debugMode) {
      debugTools.debugState.addLogEntry(
        'info',
        `Found ${textNodes.length} potential price text nodes in eBay element`,
        {
          elementHTML: element.outerHTML.substring(0, 100),
        }
      );
    }

    // Process found text nodes
    if (textNodes.length > 0) {
      let processed = false;

      // Process each text node with the callback
      for (const textNode of textNodes) {
        try {
          callback(textNode);
          processed = true;

          // If in debug mode, mark as successfully processed
          if (settings?.debugMode) {
            const nodeElement = (textNode as ChildNode).parentElement;
            if (nodeElement) {
              debugTools.markConversionSuccess(
                nodeElement,
                textNode.nodeValue || '',
                'Processed by eBay handler'
              );
            }
          }
        } catch (textNodeError) {
          logger.error(
            'Error processing eBay price text node:',
            (textNodeError as Error).message
          );
        }
      }

      return processed;
    }

    return false;
  } catch (error) {
    logger.error('Error in eBay price handler:', (error as Error).message, (error as Error).stack);
    return false;
  }
};

/**
 * Main entry point for eBay price handling
 * Processes a node if it's an eBay price element, applies callback as needed
 * This function orchestrates the eBay-specific price processing logic
 *
 * @param {Node} node - DOM node to process
 * @param {Function} callback - Callback to apply to price text nodes
 * @param {Settings} settings - The current extension settings
 * @returns {boolean} True if node was handled as an eBay price element,
 *                    false if the node is not an eBay price element or processing failed
 */
export const processIfEbay = (
  node: Node,
  callback: (textNode: Node) => void,
  settings: Settings
): boolean => {
  // Check if this is an eBay price node
  if (!isEbayPriceNode(node)) {
    return false;
  }

  // Debug logging if enabled
  if (settings?.debugMode) {
    debugTools.debugState.addLogEntry('info', 'eBay price element detected', {
      element: (node as Element).outerHTML?.substring(0, 100) || 'Unknown element',
    });
  }

  // Process the eBay price node
  return handleEbayPrice(node, callback, settings);
};
