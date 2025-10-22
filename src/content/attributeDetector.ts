/**
 * Price Attribute Detector module
 *
 * Provides enhanced detection of price elements based on common attributes,
 * class patterns, and DOM structure analysis.
 *
 * @module content/attributeDetector
 */

import * as logger from '../utils/logger.js';
import * as debugTools from './debugTools.js';

/**
 * Common price-related attributes that often contain price values
 * or indicate an element is a price container
 */
export const PRICE_ATTRIBUTES: string[] = [
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
  'itemprops',
  'itemprop',
];

export const PRICE_CLASSES: string[] = [
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

export const PRICE_CONTAINERS: string[] = [
  'prices',
  'price-container',
  'product-prices',
  'pricing',
  'price-box',
  'price-info',
  'price-wrapper',
  'price-section',
];

const hasPriceAttributes = (element: Element): boolean => {
  if (!element || !element.hasAttribute) return false;

  for (const attr of PRICE_ATTRIBUTES) {
    if (element.hasAttribute(attr)) {
      return true;
    }
  }

  if (
    element.hasAttribute('itemprop') &&
    (element.getAttribute('itemprop') || '').toLowerCase().includes('price')
  ) {
    return true;
  }

  return false;
};

const hasPriceClasses = (element: Element): boolean => {
  if (!element || !element.classList) return false;

  for (const className of PRICE_CLASSES) {
    if (element.classList.contains(className)) {
      return true;
    }
  }

  const elementClassString = Array.from(element.classList).join(' ').toLowerCase();
  const priceTerms = ['price', 'cost', 'amount', 'value', 'money', 'currency'];

  for (const term of priceTerms) {
    if (elementClassString.includes(term)) {
      return true;
    }
  }

  return false;
};

const isInPriceContainer = (element: Element): boolean => {
  if (!element || !element.closest) return false;

  for (const containerClass of PRICE_CONTAINERS) {
    if (element.closest(`.${containerClass}`)) {
      return true;
    }
  }

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

const hasPriceContent = (element: Element): boolean => {
  if (!element) return false;

  const text = element.textContent || '';

  if (text.trim().length < 2) return false;

  if (/[$€£¥₹₽¢]\s*\d/.test(text)) {
    return true;
  }

  if (
    /\d+(\.\d+)?\s*(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|HKD|NZD|SEK|KRW|SGD|NOK|MXN|INR|RUB|ZAR|BRL|[$€£¥₹₽¢])/.test(
      text
    )
  ) {
    return true;
  }

  if (/\d+\.\d{2}/.test(text) && text.length < 20) {
    return true;
  }

  return false;
};

export const isPriceElement = (element: Element | null | undefined): boolean => {
  if (!element || element.nodeType !== 1) return false;

  if (hasPriceAttributes(element)) {
    return true;
  }

  if (hasPriceClasses(element)) {
    if (hasPriceContent(element)) {
      return true;
    }
  }

  if (isInPriceContainer(element) && /\d/.test(element.textContent || '')) {
    return true;
  }

  return false;
};

export const findPriceTextNodes = (element: Element | null | undefined): Node[] => {
  if (!element) return [];

  const textNodes: Node[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let textNode: Node | null;
  while ((textNode = walker.nextNode())) {
    const text = textNode.nodeValue || '';

    if (text.trim().length < 2) continue;

    if (
      (/[$€£¥₹₽¢]/.test(text) && /\d/.test(text)) ||
      (/\d+\.\d{2}/.test(text) && text.length < 20)
    ) {
      textNodes.push(textNode);
    }
  }

  return textNodes;
};

export const extractCompositePriceNodes = (element: Element): Node[] => {
  const directPriceNodes = findPriceTextNodes(element);

  if (directPriceNodes.length > 0) {
    return directPriceNodes;
  }

  const priceFragments: Node[] = [];
  const children = element.children;

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

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (child.children.length > 2) continue;

    const childClass = Array.from(child.classList || [])
      .join(' ')
      .toLowerCase();

    const hasCompositePriceClass = compositePriceClasses.some((cls) => childClass.includes(cls));

    if (hasCompositePriceClass) {
      if (child.childNodes.length > 0) {
        for (let j = 0; j < child.childNodes.length; j++) {
          if (child.childNodes[j].nodeType === 3 && child.childNodes[j].nodeValue?.trim()) {
            priceFragments.push(child.childNodes[j]);
          }
        }
      }
    }
  }

  if (priceFragments.length === 0 && hasPriceContent(element)) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let textNode: Node | null;
    while ((textNode = walker.nextNode())) {
      if (textNode.nodeValue?.trim()) {
        priceFragments.push(textNode);
      }
    }
  }

  return priceFragments;
};

export const processElementAttributes = (
  node: Node,
  callback: (textNode: Node, settings: unknown) => void,
  settings: { debugMode?: boolean } | null
): boolean => {
  try {
    if (!node || node.nodeType !== 1) return false;

    const element = node as Element;

    if (!isPriceElement(element)) {
      return false;
    }

    if (settings?.debugMode) {
      const html = (element as HTMLElement).outerHTML;
      debugTools.debugState.addLogEntry('info', 'Attribute-based price element detected', {
        element: html?.substring(0, 100) || 'Unknown element',
      });
    }

    let priceTextNodes = findPriceTextNodes(element);

    if (priceTextNodes.length === 0) {
      priceTextNodes = extractCompositePriceNodes(element);
    }

    if (settings?.debugMode) {
      const html = (element as HTMLElement).outerHTML;
      debugTools.debugState.addLogEntry(
        'info',
        `Found ${priceTextNodes.length} potential price text nodes via attribute detection`,
        {
          elementHTML: html.substring(0, 100),
        }
      );
    }

    if (priceTextNodes.length > 0) {
      let processed = false;

      for (const textNode of priceTextNodes) {
        try {
          callback(textNode, settings);
          processed = true;

          if (settings?.debugMode) {
            const nodeElement = textNode.parentElement;
            if (nodeElement) {
              debugTools.markConversionSuccess(
                nodeElement,
                textNode.nodeValue || '',
                'Processed by attribute detector'
              );
            }
          }
        } catch (textNodeError) {
          const err = textNodeError as Error;
          logger.error('Error processing attribute price text node:', err.message);
        }
      }

      return processed;
    }

    return false;
  } catch (error) {
    const err = error as Error;
    logger.error('Error in attribute price detector:', err.message, err.stack);
    return false;
  }
};
