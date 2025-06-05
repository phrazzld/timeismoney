# Site Handlers Development Guide

## Overview

Site handlers provide specialized price extraction logic for specific e-commerce websites. This guide explains how to create and maintain site-specific handlers for optimal price detection accuracy.

## Handler Architecture

### Handler Interface

Every site handler implements this interface:

```javascript
const siteHandler = {
  name: string,              // Unique handler identifier
  domains: Array<string>,    // Domains this handler supports
  priority: number,          // Priority (1 = highest)
  
  // Core extraction method
  extract: (element, callback, settings) => boolean,
  
  // Optional validation method
  canHandle: (element) => boolean,
  
  // Optional configuration
  config: object
}
```

### Handler Registration

Handlers are automatically registered when the module loads:

```javascript
// Register handler
siteHandlers.set('handler-name', handlerObject);

// Register domains for quick lookup
registerHandlerDomains(handlerObject);
```

## Creating a New Handler

### Step 1: Analyze the Target Site

Before creating a handler, thoroughly analyze the target site:

1. **Inspect price elements** in browser dev tools
2. **Identify common selectors** for price containers
3. **Document price formats** used on the site
4. **Note special cases** (sale prices, bundles, etc.)
5. **Test across different page types** (product, category, search)

### Step 2: Create Handler Structure

```javascript
/**
 * Example site handler for ExampleShop.com
 * Handles split price components and sale prices
 */
const exampleShopHandler = {
  name: 'example-shop',
  domains: ['exampleshop.com', 'www.exampleshop.com', 'shop.example.com'],
  priority: 1,
  
  /**
   * Extract prices from ExampleShop elements
   * 
   * @param {Element} element - DOM element to process
   * @param {Function} callback - Callback for each found price
   * @param {object} settings - Extension settings
   * @returns {boolean} True if extraction attempted
   */
  extract(element, callback, settings) {
    let found = false;
    
    try {
      // Strategy 1: Look for structured price data
      const structuredPrices = this.extractStructuredPrices(element);
      structuredPrices.forEach(price => {
        callback(price);
        found = true;
      });
      
      // Strategy 2: Look for aria-label prices if no structured data
      if (!found) {
        const ariaLabelPrices = this.extractAriaLabelPrices(element);
        ariaLabelPrices.forEach(price => {
          callback(price);
          found = true;
        });
      }
      
      // Strategy 3: Fallback to text content analysis
      if (!found) {
        const textPrices = this.extractTextPrices(element);
        textPrices.forEach(price => {
          callback(price);
          found = true;
        });
      }
      
    } catch (error) {
      console.warn(`ExampleShop handler error:`, error);
    }
    
    return found;
  },
  
  /**
   * Check if element likely contains ExampleShop prices
   */
  canHandle(element) {
    // Check for site-specific price indicators
    const indicators = [
      '.price-current',
      '.sale-price', 
      '[data-price]',
      '.product-price'
    ];
    
    return indicators.some(selector => 
      element.querySelector(selector) !== null
    );
  },
  
  // Helper methods for different extraction strategies
  extractStructuredPrices(element) {
    const prices = [];
    
    // Look for data attributes
    const priceElements = element.querySelectorAll('[data-price]');
    for (const el of priceElements) {
      const value = el.getAttribute('data-price');
      const currency = el.getAttribute('data-currency') || '$';
      
      if (value && !isNaN(parseFloat(value))) {
        prices.push({
          textContent: `${currency}${value}`,
          confidence: 0.95,
          source: 'data-attribute'
        });
      }
    }
    
    return prices;
  },
  
  extractAriaLabelPrices(element) {
    const prices = [];
    
    // Look for aria-label attributes containing prices
    const labelElements = element.querySelectorAll('[aria-label*="$"], [aria-label*="price"]');
    for (const el of labelElements) {
      const label = el.getAttribute('aria-label');
      const priceMatch = label.match(/\$(\d+(?:\.\d{2})?)/);
      
      if (priceMatch) {
        prices.push({
          textContent: priceMatch[0],
          confidence: 0.9,
          source: 'aria-label'
        });
      }
    }
    
    return prices;
  },
  
  extractTextPrices(element) {
    const prices = [];
    
    // Site-specific selectors for text-based prices
    const selectors = [
      '.price-current .price-value',
      '.product-price .amount',
      '.sale-price'
    ];
    
    for (const selector of selectors) {
      const priceElements = element.querySelectorAll(selector);
      for (const el of priceElements) {
        const text = el.textContent.trim();
        if (text && /\$\d+/.test(text)) {
          prices.push({
            textContent: text,
            confidence: 0.8,
            source: 'text-content'
          });
        }
      }
    }
    
    return prices;
  }
};
```

### Step 3: Register the Handler

Add the handler to `siteHandlers.js`:

```javascript
// Register the handler
siteHandlers.set('example-shop', exampleShopHandler);

// Update domain mapping
registerHandlerDomains(exampleShopHandler);

// Export for testing
export { exampleShopHandler };
```

## Handler Implementation Patterns

### Pattern 1: Split Price Components

For prices split across multiple elements:

```javascript
extractSplitPrices(element) {
  const prices = [];
  
  // Look for currency + dollars + cents pattern
  const priceContainers = element.querySelectorAll('.price-container');
  
  for (const container of priceContainers) {
    const currency = container.querySelector('.currency')?.textContent || '$';
    const dollars = container.querySelector('.dollars')?.textContent || '0';
    const cents = container.querySelector('.cents')?.textContent || '00';
    
    if (dollars && cents) {
      const fullPrice = `${currency}${dollars}.${cents}`;
      prices.push({
        textContent: fullPrice,
        confidence: 0.92,
        source: 'split-components'
      });
    }
  }
  
  return prices;
}
```

### Pattern 2: Multiple Price Types

For sites with various price types (regular, sale, bundle):

```javascript
extractMultiplePriceTypes(element) {
  const prices = [];
  
  // Priority order: sale price > regular price > bundle price
  const priceTypes = [
    { selector: '.sale-price', confidence: 0.95, type: 'sale' },
    { selector: '.regular-price', confidence: 0.9, type: 'regular' },
    { selector: '.bundle-price', confidence: 0.85, type: 'bundle' }
  ];
  
  for (const priceType of priceTypes) {
    const elements = element.querySelectorAll(priceType.selector);
    if (elements.length > 0) {
      // Found this price type, process and return (highest priority wins)
      for (const el of elements) {
        const price = this.extractPriceFromElement(el, priceType);
        if (price) {
          prices.push(price);
        }
      }
      break; // Only use highest priority price type found
    }
  }
  
  return prices;
}
```

### Pattern 3: Dynamic Content Handling

For sites with JavaScript-loaded prices:

```javascript
extractDynamicPrices(element) {
  const prices = [];
  
  // Wait for dynamic content to load
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const dynamicPrices = this.extractStaticPrices(node);
            prices.push(...dynamicPrices);
          }
        });
      }
    });
  });
  
  // Observe for a short time
  observer.observe(element, { childList: true, subtree: true });
  
  // Clean up after timeout
  setTimeout(() => observer.disconnect(), 2000);
  
  return prices;
}
```

## Testing Site Handlers

### Unit Testing

Create comprehensive unit tests:

```javascript
describe('ExampleShop Handler', () => {
  beforeEach(() => {
    // Set up DOM environment
    document.body.innerHTML = '';
  });
  
  test('should extract structured price data', () => {
    document.body.innerHTML = `
      <div class="product">
        <span data-price="25.99" data-currency="$">Price</span>
      </div>
    `;
    
    const element = document.body;
    const callback = vi.fn();
    
    const result = exampleShopHandler.extract(element, callback, {});
    
    expect(result).toBe(true);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        textContent: '$25.99',
        confidence: 0.95
      })
    );
  });
  
  test('should handle missing price data gracefully', () => {
    document.body.innerHTML = '<div>No price data</div>';
    
    const element = document.body;
    const callback = vi.fn();
    
    const result = exampleShopHandler.extract(element, callback, {});
    
    expect(result).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });
});
```

### Integration Testing

Test with the full pipeline:

```javascript
test('should work with complete extraction pipeline', async () => {
  // Create realistic DOM structure
  document.body.innerHTML = `
    <div class="product-page">
      <div class="price-container">
        <span class="currency">$</span>
        <span class="dollars">25</span>
        <span class="cents">99</span>
      </div>
    </div>
  `;
  
  const element = document.querySelector('.product-page');
  const result = await extractPrice(element);
  
  expect(result).toBeDefined();
  expect(result.value).toBe('25.99');
  expect(result.currency).toBe('$');
  expect(result.strategy).toBe('site-specific');
});
```

### Live Site Testing

Test on actual websites using browser console:

```javascript
// Test script for browser console
(async function testHandler() {
  // Inject handler (in development)
  const testElement = document.querySelector('.price-container');
  
  if (testElement) {
    const result = await extractPrice(testElement, {
      debug: true,
      returnMultiple: true
    });
    
    console.log('Handler test result:', result);
    console.log('Strategies used:', result.debugInfo?.strategies);
    console.log('Performance:', result.debugInfo?.timing);
  } else {
    console.log('No price container found on this page');
  }
})();
```

## Handler Maintenance

### Regular Updates

Site handlers need periodic maintenance:

1. **Monitor site changes**: Check for layout/markup updates
2. **Performance tracking**: Monitor extraction success rates
3. **User feedback**: Address reported detection failures
4. **A/B testing**: Sites may test different price layouts

### Version Management

Track handler versions and changes:

```javascript
const amazonHandler = {
  name: 'amazon',
  version: '2.1.0',
  lastUpdated: '2024-01-15',
  changeLog: [
    '2.1.0: Added support for Subscribe & Save prices',
    '2.0.0: Complete rewrite for new Amazon layout',
    '1.5.2: Fixed aria-label detection'
  ],
  // ... handler implementation
};
```

### Performance Monitoring

Add performance tracking:

```javascript
extract(element, callback, settings) {
  const startTime = performance.now();
  let extractionAttempted = false;
  let extractionSuccessful = false;
  
  try {
    // ... extraction logic
    
    extractionAttempted = true;
    if (found) {
      extractionSuccessful = true;
    }
    
  } finally {
    // Log performance metrics
    const duration = performance.now() - startTime;
    this.logPerformance({
      site: this.name,
      duration,
      attempted: extractionAttempted,
      successful: extractionSuccessful
    });
  }
  
  return found;
}
```

## Best Practices

### 1. Graceful Degradation

Always provide fallback strategies:

```javascript
extract(element, callback, settings) {
  // Try most specific approach first
  if (this.extractSpecificFormat(element, callback)) {
    return true;
  }
  
  // Fall back to general approaches
  if (this.extractGenericFormat(element, callback)) {
    return true;
  }
  
  // Final fallback to text analysis
  return this.extractTextContent(element, callback);
}
```

### 2. Error Handling

Handle all possible error conditions:

```javascript
extract(element, callback, settings) {
  try {
    // Validate inputs
    if (!element || typeof callback !== 'function') {
      return false;
    }
    
    // Main extraction logic
    
  } catch (error) {
    // Log error but don't crash
    console.warn(`${this.name} handler error:`, error);
    return false;
  }
}
```

### 3. Performance Optimization

Keep handlers fast and efficient:

```javascript
// Cache expensive queries
const priceSelectors = ['.price', '.cost', '.amount'];
const cachedElements = priceSelectors
  .map(selector => element.querySelectorAll(selector))
  .flat();

// Use specific selectors
const priceElements = element.querySelectorAll('.price-current'); // Good
const allElements = element.querySelectorAll('*'); // Avoid

// Limit DOM traversal depth
const prices = element.querySelectorAll('.product > .price'); // Specific
const deepPrices = element.querySelectorAll('div div div .price'); // Too deep
```

### 4. Maintainable Code

Write clear, maintainable handler code:

```javascript
// Use descriptive method names
extractAmazonSplitPrices() // Good
extractPrices1() // Poor

// Document complex logic
/**
 * Amazon uses a complex price structure where:
 * - Regular price is in .a-price-whole + .a-price-fraction
 * - Sale price is in .a-price-discount
 * - Prime price may be in different container
 */

// Use constants for selectors
const SELECTORS = {
  PRICE_CONTAINER: '.a-price',
  WHOLE_PRICE: '.a-price-whole',
  FRACTIONAL_PRICE: '.a-price-fraction',
  CURRENCY: '.a-price-symbol'
};
```

This guide provides a complete framework for creating robust, maintainable site handlers that deliver accurate price detection across diverse e-commerce platforms.