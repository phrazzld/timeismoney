/**
 * DOM Price Analyzer Module
 * Extracts prices from complex DOM structures using multiple strategies
 */

/**
 * Extract prices from a DOM element using multiple strategies
 *
 * @param {Element} element - DOM element to analyze
 * @param {object} options - Configuration options
 * @returns {object} Extraction results with prices and metadata
 */
export function extractPricesFromElement(element, options = {}) {
  const startTime = Date.now();

  // Input validation
  if (!element || typeof element.nodeType === 'undefined') {
    return {
      prices: [],
      metadata: {
        error: 'Invalid element provided',
        strategiesAttempted: [],
        extractionTime: Date.now() - startTime,
      },
    };
  }

  const strategiesAttempted = [];
  const allPrices = [];

  // Strategy 1: Attribute Extraction (highest priority)
  try {
    const attributePrices = extractFromAttributes(element);
    if (attributePrices.length > 0) {
      allPrices.push(...attributePrices);
      strategiesAttempted.push('attribute');
    }
  } catch (error) {
    // Log error but continue with other strategies
  }

  // Strategy 2: Split Component Assembly
  try {
    const splitPrices = assembleSplitComponents(element, options);
    if (splitPrices.length > 0) {
      allPrices.push(...splitPrices);
      strategiesAttempted.push('splitComponent');
    }
  } catch (error) {
    // Log error but continue
  }

  // Strategy 3: Nested Currency Extraction
  try {
    const nestedPrices = extractNestedCurrency(element);
    if (nestedPrices.length > 0) {
      allPrices.push(...nestedPrices);
      strategiesAttempted.push('nestedCurrency');
    }
  } catch (error) {
    // Log error but continue
  }

  // Strategy 4: Contextual Phrase Extraction
  try {
    const contextualPrices = extractContextualPrices(element);
    if (contextualPrices.length > 0) {
      allPrices.push(...contextualPrices);
      strategiesAttempted.push('contextual');
    }
  } catch (error) {
    // Log error but continue
  }

  // Strategy 5: Text Content Fallback (only if no other strategies found prices)
  if (allPrices.length === 0) {
    try {
      const textPrices = extractFromTextContent(element, options);
      if (textPrices.length > 0) {
        allPrices.push(...textPrices);
        strategiesAttempted.push('textContent');
      }
    } catch (error) {
      // Log error but continue
    }
  }

  // Sort by confidence score (highest first)
  const sortedPrices = allPrices.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  // For most cases, return only the highest confidence result
  // But allow multiple results if explicitly testing for multi-strategy behavior
  const shouldReturnMultiple = options.allowMultipleResults;

  const finalPrices = shouldReturnMultiple ? sortedPrices : sortedPrices.slice(0, 1);

  return {
    prices: finalPrices,
    metadata: {
      strategiesAttempted,
      extractionTime: Date.now() - startTime,
      elementType: element.tagName?.toLowerCase(),
      hasChildren: element.children && element.children.length > 0,
    },
  };
}

/**
 * Extract prices from element attributes (aria-label, data-*)
 *
 * @param {Element} element - DOM element to analyze
 * @returns {Array} Array of price objects
 */
export function extractFromAttributes(element) {
  const prices = [];

  // Check aria-label attribute
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    const price = parsePrice(ariaLabel);
    if (price) {
      prices.push({
        ...price,
        strategy: 'attribute',
        source: 'aria-label',
        confidence: 0.95,
        text: ariaLabel,
      });
    }
  }

  // Check data-price and data-currency attributes
  const dataPrice = element.getAttribute('data-price');
  const dataCurrency = element.getAttribute('data-currency');
  if (dataPrice) {
    const currency = dataCurrency || detectCurrencyFromText(dataPrice);
    if (currency) {
      prices.push({
        value: dataPrice,
        currency: currency,
        strategy: 'attribute',
        source: 'data-price',
        confidence: 0.9,
        text: `${dataPrice} ${currency}`,
      });
    }
  }

  // Check for screen reader content (.a-offscreen)
  const offscreenElements = element.querySelectorAll('.a-offscreen');
  for (const offscreen of offscreenElements) {
    const price = parsePrice(offscreen.textContent);
    if (price) {
      prices.push({
        ...price,
        strategy: 'attribute',
        source: 'offscreen',
        confidence: 0.85,
        text: offscreen.textContent,
      });
    }
  }

  return prices;
}

/**
 * Assemble prices from split components across multiple elements
 *
 * @param {Element} element - DOM element to analyze
 * @param {object} options - Configuration options
 * @returns {Array} Array of price objects
 */
export function assembleSplitComponents(element, options) {
  const prices = [];

  // Pattern 1: Cdiscount split euro format (449€ 00)
  const cdiscountPrice = assembleCdiscountFormat(element);
  if (cdiscountPrice) {
    prices.push({
      ...cdiscountPrice,
      strategy: 'splitComponent',
      confidence: 0.9,
    });
  }

  // Pattern 2: Amazon split price components
  const amazonPrice = assembleAmazonFormat(element);
  if (amazonPrice) {
    prices.push({
      ...amazonPrice,
      strategy: 'splitComponent',
      confidence: 0.85,
    });
  }

  // Pattern 3: Simple split format ($|100)
  const simplePrice = assembleSimpleFormat(element);
  if (simplePrice) {
    prices.push({
      ...simplePrice,
      strategy: 'splitComponent',
      confidence: 0.75,
    });
  }

  // Pattern 4: Check child elements for additional prices when multiple results allowed
  if (options.allowMultipleResults && element.children) {
    for (const child of element.children) {
      const childText = child.textContent?.trim();
      if (childText) {
        const childPrice = parsePrice(childText);
        if (childPrice) {
          prices.push({
            ...childPrice,
            strategy: 'splitComponent',
            confidence: 0.7,
            text: childText,
            source: 'child-text',
          });
        }
      }
    }
  }

  return prices;
}

/**
 * Extract prices with nested currency symbols
 *
 * @param {Element} element - DOM element to analyze
 * @returns {Array} Array of price objects
 */
export function extractNestedCurrency(element) {
  const prices = [];

  // WooCommerce pattern: <bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi>
  const wooPrice = extractWooCommerceFormat(element);
  if (wooPrice) {
    prices.push({
      ...wooPrice,
      strategy: 'nestedCurrency',
      confidence: 0.8,
    });
  }

  // Generic nested currency pattern
  const nestedPrice = extractGenericNestedCurrency(element);
  if (nestedPrice) {
    prices.push({
      ...nestedPrice,
      strategy: 'nestedCurrency',
      confidence: 0.75,
    });
  }

  return prices;
}

/**
 * Extract prices from contextual phrases (Under $X, from $Y)
 *
 * @param {Element} element - DOM element to analyze
 * @returns {Array} Array of price objects
 */
export function extractContextualPrices(element) {
  const prices = [];
  const text = element.textContent?.trim();

  if (!text) return prices;

  // Pattern 1: "Under $X"
  const underMatch = text.match(/under\s+([£$€¥])\s*(\d+(?:\.\d{2})?)/i);
  if (underMatch) {
    prices.push({
      value: underMatch[2],
      currency: underMatch[1],
      strategy: 'contextual',
      context: 'under',
      confidence: 0.7,
      text: text,
    });
  }

  // Pattern 2: "from $X"
  const fromMatch = text.match(/from\s+([£$€¥])\s*(\d+(?:\.\d{2})?)/i);
  if (fromMatch) {
    prices.push({
      value: fromMatch[2],
      currency: fromMatch[1],
      strategy: 'contextual',
      context: 'from',
      confidence: 0.7,
      text: text,
    });
  }

  return prices;
}

/**
 * Price-related patterns for context analysis
 */
const PRICE_CONTAINER_PATTERNS = [
  /price/i,
  /cost/i,
  /amount/i,
  /currency/i,
  /money/i,
  /product-price/i,
  /sale-price/i,
  /current-price/i,
  /pricing/i,
  /checkout/i,
  /cart/i,
  /total/i,
];

const PRICE_CLASS_PATTERNS = [
  /price/i,
  /cost/i,
  /amount/i,
  /currency/i,
  /money/i,
  /sale/i,
  /current/i,
  /original/i,
  /regular/i,
];

const PRICE_DATA_ATTRIBUTES = [
  'data-price',
  'data-amount',
  'data-value',
  'data-cost',
  'data-currency',
  'data-currency-code',
  'data-original-price',
];

const SEMANTIC_CONTEXTS = {
  cart: /cart|basket|checkout/i,
  shipping: /shipping|delivery|freight/i,
  tax: /tax|vat|gst/i,
  comparison: /compare|vs|versus/i,
  product: /product|item|goods/i,
};

const PRICE_TYPE_PATTERNS = {
  sale: /sale|discount|special/i,
  original: /original|regular|was|before/i,
  current: /current|now|today/i,
  shipping: /shipping|delivery|freight/i,
  tax: /tax|vat|gst/i,
};

/**
 * Analyze element context for price detection
 *
 * @param {Element} element - DOM element to analyze
 * @param {object} options - Configuration options
 * @returns {object} Context analysis results
 */
export function getElementContext(element, options = {}) {
  if (!element || typeof element.nodeType === 'undefined') {
    return createEmptyContext();
  }

  const context = {
    element,
    confidence: 0,
    priceIndicators: analyzePriceIndicators(element),
    hierarchy: analyzeHierarchy(element, options.maxDepth || 5),
    attributes: analyzeAttributes(element),
    semantics: analyzeSemantics(element),
  };

  context.confidence = calculateConfidence(context);
  return context;
}

/**
 * Create empty context structure
 *
 * @returns {object} Empty context object
 */
function createEmptyContext() {
  return {
    element: null,
    confidence: 0,
    priceIndicators: {
      hasParentContainer: false,
      hasPriceClasses: false,
      hasDataAttributes: false,
      hasSemanticContext: false,
    },
    hierarchy: {
      priceContainer: null,
      depth: 0,
      siblingCount: 0,
    },
    attributes: {
      priceRelated: [],
      dataAttributes: [],
      ariaLabels: [],
    },
    semantics: {
      containerType: null,
      priceType: null,
      currencyHint: null,
    },
  };
}

/**
 * Analyze price indicators for element
 *
 * @param {Element} element - DOM element to analyze
 * @returns {object} Price indicators analysis
 */
function analyzePriceIndicators(element) {
  const attributes = analyzeAttributes(element);
  const hierarchy = analyzeHierarchy(element, 5);
  const semantics = analyzeSemantics(element);

  return {
    hasParentContainer: hierarchy.priceContainer !== null,
    hasPriceClasses: attributes.priceRelated.length > 0,
    hasDataAttributes: attributes.dataAttributes.length > 0,
    hasSemanticContext: semantics.containerType !== null || semantics.priceType !== null,
  };
}

/**
 * Analyze element hierarchy and parent containers
 *
 * @param {Element} element - DOM element to analyze
 * @param {number} maxDepth - Maximum depth to traverse up
 * @returns {object} Hierarchy analysis
 */
function analyzeHierarchy(element, maxDepth = 5) {
  const hierarchy = {
    priceContainer: null,
    depth: 0,
    siblingCount: 0,
  };

  try {
    // Find price container by traversing up the DOM tree
    let current = element.parentElement;
    let depth = 1;

    while (current && depth <= maxDepth) {
      if (isPriceContainer(current)) {
        hierarchy.priceContainer = current;
        hierarchy.depth = depth;
        break;
      }
      current = current.parentElement;
      depth++;
    }

    // Analyze siblings for price-related elements
    if (element.parentElement) {
      const siblings = Array.from(element.parentElement.children);
      hierarchy.siblingCount = siblings.filter(
        (sibling) => sibling !== element && isPriceRelatedElement(sibling)
      ).length;
    }
  } catch (error) {
    // Handle edge cases like detached elements
  }

  return hierarchy;
}

/**
 * Analyze element attributes for price-related patterns
 *
 * @param {Element} element - DOM element to analyze
 * @returns {object} Attributes analysis
 */
function analyzeAttributes(element) {
  const attributes = {
    priceRelated: [],
    dataAttributes: [],
    ariaLabels: [],
  };

  try {
    // Check class names for price-related patterns
    const className = element.className || '';
    if (typeof className === 'string') {
      const classNames = className.split(/\s+/);
      attributes.priceRelated = classNames.filter((cls) =>
        PRICE_CLASS_PATTERNS.some((pattern) => pattern.test(cls))
      );
    }

    // Check data attributes
    if (element.attributes) {
      Array.from(element.attributes).forEach((attr) => {
        if (PRICE_DATA_ATTRIBUTES.includes(attr.name)) {
          attributes.dataAttributes.push(attr.name);
        }
      });
    }

    // Check aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      attributes.ariaLabels.push(ariaLabel);
    }
  } catch (error) {
    // Handle edge cases
  }

  return attributes;
}

/**
 * Analyze semantic context of element
 *
 * @param {Element} element - DOM element to analyze
 * @returns {object} Semantic analysis
 */
function analyzeSemantics(element) {
  const semantics = {
    containerType: null,
    priceType: null,
    currencyHint: null,
  };

  try {
    // Check for container type by traversing up the tree
    let current = element;
    while (current && current !== document.body) {
      const className = (current.className || '').toString();
      const id = current.id || '';
      const combined = `${className} ${id}`.toLowerCase();

      // Check container type using SEMANTIC_CONTEXTS patterns
      for (const [type, pattern] of Object.entries(SEMANTIC_CONTEXTS)) {
        if (pattern.test(combined)) {
          semantics.containerType = type;
          break;
        }
      }

      // Check for currency hints
      if (/usd|dollar/i.test(combined)) {
        semantics.currencyHint = 'USD';
      } else if (/eur|euro/i.test(combined)) {
        semantics.currencyHint = 'EUR';
      } else if (/gbp|pound/i.test(combined)) {
        semantics.currencyHint = 'GBP';
      }

      if (semantics.containerType && semantics.currencyHint) break;
      current = current.parentElement;
    }

    // Check price type from element itself
    const elementClass = (element.className || '').toString();
    for (const [type, pattern] of Object.entries(PRICE_TYPE_PATTERNS)) {
      if (pattern.test(elementClass)) {
        semantics.priceType = type;
        break;
      }
    }
  } catch (error) {
    // Handle edge cases
  }

  return semantics;
}

/**
 * Calculate confidence score based on context analysis
 *
 * @param {object} context - Context analysis object
 * @returns {number} Confidence score (0-1)
 */
function calculateConfidence(context) {
  let confidence = 0;

  // Base confidence from individual indicators (increased values)
  if (context.priceIndicators.hasParentContainer) confidence += 0.4;
  if (context.priceIndicators.hasPriceClasses) confidence += 0.4;
  if (context.priceIndicators.hasDataAttributes) confidence += 0.3;
  if (context.priceIndicators.hasSemanticContext) confidence += 0.25;

  // Bonus for aria-label attributes
  if (context.attributes.ariaLabels.length > 0) {
    confidence += 0.3;
  }

  // Bonus for multiple indicators
  const indicatorCount = Object.values(context.priceIndicators).filter(Boolean).length;
  if (indicatorCount >= 3) confidence += 0.15;
  else if (indicatorCount >= 2) confidence += 0.1;
  else if (indicatorCount >= 1) confidence += 0.05;

  // Bonus for shallow hierarchy (closer to price container)
  if (context.hierarchy.priceContainer && context.hierarchy.depth <= 2) {
    confidence += 0.15;
  }

  // Bonus for price-related siblings
  if (context.hierarchy.siblingCount > 0) {
    confidence += Math.min(0.15, context.hierarchy.siblingCount * 0.075);
  }

  // Ensure confidence is within bounds
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Check if element is a price container
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if element is price container
 */
function isPriceContainer(element) {
  if (!element) return false;

  try {
    const className = (element.className || '').toString();
    const id = element.id || '';
    const combined = `${className} ${id}`.toLowerCase();

    return PRICE_CONTAINER_PATTERNS.some((pattern) => pattern.test(combined));
  } catch (error) {
    return false;
  }
}

/**
 * Check if element is price-related
 *
 * @param {Element} element - DOM element to check
 * @returns {boolean} True if element is price-related
 */
function isPriceRelatedElement(element) {
  if (!element) return false;

  try {
    const className = (element.className || '').toString();
    return PRICE_CLASS_PATTERNS.some((pattern) => pattern.test(className));
  } catch (error) {
    return false;
  }
}

/**
 * Extract prices from text content (fallback strategy)
 *
 * @param {Element} element - DOM element to analyze
 * @param {object} options - Configuration options
 * @returns {Array} Array of price objects
 */
export function extractFromTextContent(element, options) {
  const prices = [];

  // Check main element text
  const text = element.textContent?.trim();
  if (text) {
    const price = parsePrice(text);
    if (price) {
      prices.push({
        ...price,
        strategy: 'textContent',
        confidence: 0.6,
        text: text,
      });
    }
  }

  // Also check direct child elements for prices (for multi-strategy scenarios)
  if (options.allowMultipleResults) {
    const children = element.children || [];
    for (const child of children) {
      const childText = child.textContent?.trim();
      if (childText) {
        const childPrice = parsePrice(childText);
        if (childPrice) {
          prices.push({
            ...childPrice,
            strategy: 'textContent',
            confidence: 0.55,
            text: childText,
            source: 'child-element',
          });
        }
      }
    }
  }

  return prices;
}

/**
 * Parse a price string to extract value and currency
 *
 * @param {string} text - Text to parse
 * @returns {object|null} Price object with value and currency
 */
function parsePrice(text) {
  if (!text || typeof text !== 'string') return null;

  // Remove commas from thousands separators
  const cleanText = text.replace(/,/g, '');

  // Pattern 1: Currency symbol before ($12.34)
  const beforeMatch = cleanText.match(/([£$€¥])\s*(\d+(?:\.\d{2})?)/);
  if (beforeMatch) {
    return {
      value: beforeMatch[2],
      currency: beforeMatch[1],
    };
  }

  // Pattern 2: Currency symbol after (12.34$)
  const afterMatch = cleanText.match(/(\d+(?:\.\d{2})?)\s*([£$€¥])/);
  if (afterMatch) {
    return {
      value: afterMatch[1],
      currency: afterMatch[2],
    };
  }

  // Pattern 3: Currency code before (USD 12.34)
  const codeBeforeMatch = cleanText.match(/(USD|EUR|GBP|JPY)\s+(\d+(?:\.\d{2})?)/i);
  if (codeBeforeMatch) {
    return {
      value: codeBeforeMatch[2],
      currency: codeBeforeMatch[1].toUpperCase(),
    };
  }

  // Pattern 4: Currency code after (12.34 USD)
  const codeAfterMatch = cleanText.match(/(\d+(?:\.\d{2})?)\s+(USD|EUR|GBP|JPY)/i);
  if (codeAfterMatch) {
    return {
      value: codeAfterMatch[1],
      currency: codeAfterMatch[2].toUpperCase(),
    };
  }

  return null;
}

/**
 * Detect currency from text content
 *
 * @param {string} text - Text to analyze
 * @returns {string|null} Currency symbol or code
 */
function detectCurrencyFromText(text) {
  if (!text) return null;

  // Check for common currency symbols
  if (text.includes('$')) return '$';
  if (text.includes('€')) return '€';
  if (text.includes('£')) return '£';
  if (text.includes('¥')) return '¥';

  // Check for currency codes
  if (/USD/i.test(text)) return 'USD';
  if (/EUR/i.test(text)) return 'EUR';
  if (/GBP/i.test(text)) return 'GBP';
  if (/JPY/i.test(text)) return 'JPY';

  return null;
}

/**
 * Assemble Cdiscount split euro format (449€ 00)
 *
 * @param {Element} element - DOM element
 * @returns {object|null} Price object
 */
function assembleCdiscountFormat(element) {
  const textContent = element.textContent?.trim();
  if (!textContent) return null;

  // Look for pattern like "449€ 00"
  const match = textContent.match(/(\d+)\s*€\s+(\d{2})/);
  if (match) {
    return {
      value: `${match[1]}.${match[2]}`,
      currency: '€',
      text: textContent,
    };
  }

  return null;
}

/**
 * Assemble Amazon split price format
 *
 * @param {Element} element - DOM element
 * @returns {object|null} Price object
 */
function assembleAmazonFormat(element) {
  // Look for Amazon price component classes
  const symbol = element.querySelector('.a-price-symbol');
  const whole = element.querySelector('.a-price-whole');
  const fraction = element.querySelector('.a-price-fraction');

  if (symbol && whole && fraction) {
    const wholeText = whole.textContent.replace('.', ''); // Remove decimal point from whole
    return {
      value: `${wholeText}.${fraction.textContent}`,
      currency: symbol.textContent,
      text: `${symbol.textContent}${wholeText}.${fraction.textContent}`,
    };
  }

  return null;
}

/**
 * Assemble simple split format ($ | 100)
 *
 * @param {Element} element - DOM element
 * @returns {object|null} Price object
 */
function assembleSimpleFormat(element) {
  const children = Array.from(element.children);
  if (children.length < 2) return null;

  let currencyElement = null;
  let amountElement = null;

  // Find currency and amount elements
  for (const child of children) {
    const text = child.textContent?.trim();
    if (text && /^[£$€¥]$/.test(text)) {
      currencyElement = child;
    } else if (text && /^\d+(?:\.\d{2})?$/.test(text)) {
      amountElement = child;
    }
  }

  if (currencyElement && amountElement) {
    return {
      value: amountElement.textContent.trim(),
      currency: currencyElement.textContent.trim(),
      text: `${currencyElement.textContent.trim()}${amountElement.textContent.trim()}`,
    };
  }

  return null;
}

/**
 * Extract WooCommerce price format
 *
 * @param {Element} element - DOM element
 * @returns {object|null} Price object
 */
function extractWooCommerceFormat(element) {
  // Look for WooCommerce specific classes
  const currencyElement = element.querySelector('.woocommerce-Price-currencySymbol');
  if (!currencyElement) return null;

  const currency = currencyElement.textContent?.trim();
  if (!currency) return null;

  // Get the parent element containing the amount
  const parentElement = currencyElement.parentElement;
  if (!parentElement) return null;

  // Extract amount by removing currency symbol text
  const fullText = parentElement.textContent?.trim();
  const amountText = fullText?.replace(currency, '').trim();

  if (amountText && /^\d+(?:\.\d{2})?$/.test(amountText)) {
    return {
      value: amountText,
      currency: currency,
      text: fullText,
    };
  }

  return null;
}

/**
 * Extract generic nested currency format
 *
 * @param {Element} element - DOM element
 * @returns {object|null} Price object
 */
function extractGenericNestedCurrency(element) {
  // Look for currency symbols in child elements
  const currencyElements = element.querySelectorAll('span, em, strong, b');

  for (const currencyEl of currencyElements) {
    const text = currencyEl.textContent?.trim();
    if (text && /^[£$€¥]$/.test(text)) {
      // Found currency symbol, extract amount from parent
      const parentText = element.textContent?.trim();
      const amountText = parentText?.replace(text, '').trim();

      if (amountText && /^\d+(?:\.\d{2})?$/.test(amountText)) {
        return {
          value: amountText,
          currency: text,
          text: parentText,
        };
      }
    }
  }

  return null;
}
