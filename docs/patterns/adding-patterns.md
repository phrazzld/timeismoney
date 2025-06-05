# Adding New Patterns Guide

## Overview

This guide explains how to add new price detection patterns to the enhanced detection system. Follow these steps to extend pattern recognition for new formats or sites.

## Quick Start

### 1. Identify the Pattern Type

Determine which type of pattern you're adding:

- **Text Pattern**: Regular expression-based text matching
- **DOM Attribute Pattern**: HTML attribute-based extraction  
- **Split Component Pattern**: Multi-element price assembly
- **Site-Specific Pattern**: Custom logic for specific websites

### 2. Choose the Right Module

- **Text patterns**: `src/content/pricePatterns.js`
- **DOM patterns**: `src/content/domPriceAnalyzer.js`
- **Site handlers**: `src/content/siteHandlers.js`
- **Pipeline integration**: `src/content/priceExtractor.js`

## Adding Text Patterns

### Step 1: Create the Pattern Function

Add your pattern function to `pricePatterns.js`:

```javascript
/**
 * Match your custom price format
 * 
 * @param {string} text - Text to analyze
 * @returns {Array} Array of pattern matches
 */
export function matchCustomFormat(text) {
  if (!text || typeof text !== 'string') return [];
  
  const matches = [];
  const regex = /your-pattern-here/g;
  
  for (const match of text.matchAll(regex)) {
    matches.push({
      value: match[1],           // Numeric value
      currency: match[2],        // Currency symbol
      original: match[0],        // Full match
      confidence: 0.85,          // Confidence score
      pattern: 'custom-format'   // Pattern identifier
    });
  }
  
  return matches;
}
```

### Step 2: Integrate with Pattern Library

Add to the `selectBestPattern` function:

```javascript
export function selectBestPattern(text, context = {}) {
  // ... existing patterns
  
  // Add your custom pattern
  const customMatches = matchCustomFormat(text);
  allMatches.push(...customMatches);
  
  // ... rest of function
}
```

### Step 3: Write Tests

Create test cases in `src/__tests__/content/pricePatterns.vitest.test.js`:

```javascript
describe('Custom Format Pattern', () => {
  test('should match custom price format', () => {
    const text = 'Price: CUSTOM_25.99_FORMAT';
    const matches = matchCustomFormat(text);
    
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe('25.99');
    expect(matches[0].confidence).toBeGreaterThan(0.8);
  });
});
```

## Adding DOM Patterns

### Step 1: Create Extraction Function

Add to `domPriceAnalyzer.js`:

```javascript
/**
 * Extract prices from custom DOM structure
 * 
 * @param {Element} element - DOM element to analyze
 * @returns {Array} Array of extracted prices
 */
export function extractCustomDomPattern(element) {
  const prices = [];
  
  // Your custom DOM analysis logic
  const priceElements = element.querySelectorAll('.custom-price-selector');
  
  for (const priceEl of priceElements) {
    const value = extractValueFromElement(priceEl);
    const currency = extractCurrencyFromElement(priceEl);
    
    if (value && currency) {
      prices.push({
        value,
        currency,
        text: priceEl.textContent.trim(),
        confidence: 0.9,
        source: 'custom-dom-pattern',
        strategy: 'structure'
      });
    }
  }
  
  return prices;
}
```

### Step 2: Integrate with DOM Analyzer

Add to the main `extractPricesFromElement` function:

```javascript
// Add to the strategies array
const domStrategies = [
  // ... existing strategies
  {
    name: 'custom-dom-pattern',
    extract: extractCustomDomPattern,
    confidence: 0.9
  }
];
```

## Adding Site-Specific Handlers

### Step 1: Create Handler Object

Add to `siteHandlers.js`:

```javascript
/**
 * Custom site-specific handler
 */
const customSiteHandler = {
  name: 'custom-site',
  domains: ['example.com', 'shop.example.com'],
  priority: 1,
  
  /**
   * Extract prices from custom site elements
   */
  extract: (element, callback, settings) => {
    // Site-specific extraction logic
    const priceElements = element.querySelectorAll('.site-specific-price');
    
    priceElements.forEach(priceEl => {
      const price = extractSiteSpecificPrice(priceEl);
      if (price) {
        callback(price);
      }
    });
    
    return priceElements.length > 0;
  },
  
  /**
   * Validate if element contains site-specific price indicators
   */
  canHandle: (element) => {
    return element.querySelector('.site-specific-price') !== null;
  }
};
```

### Step 2: Register Handler

Add to the handler registry:

```javascript
// Register the handler
siteHandlers.set('custom-site', customSiteHandler);

// Update domain mapping
registerHandlerDomains(customSiteHandler);
```

## Testing Your Patterns

### Unit Tests

Create comprehensive unit tests:

```javascript
describe('Custom Pattern Integration', () => {
  test('should detect custom pattern in real content', () => {
    const testHtml = `
      <div class="price-container">
        <span class="custom-price">PRICE: 25.99 USD</span>
      </div>
    `;
    
    document.body.innerHTML = testHtml;
    const element = document.querySelector('.price-container');
    
    const prices = extractPricesFromElement(element);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0].value).toBe('25.99');
    expect(prices[0].currency).toBe('USD');
  });
});
```

### Integration Tests

Test with the full pipeline:

```javascript
test('should work with complete extraction pipeline', async () => {
  const element = createTestElement();
  const result = await extractPrice(element);
  
  expect(result).toBeDefined();
  expect(result.strategy).toBe('custom-pattern');
  expect(result.confidence).toBeGreaterThan(0.8);
});
```

### Live Site Testing

Test on actual websites:

```javascript
// Use browser console or test pages
const testElement = document.querySelector('.price-container');
const result = await extractPrice(testElement, { 
  debug: true,
  returnMultiple: true 
});
console.log('Detection result:', result);
```

## Performance Considerations

### Pattern Efficiency

- Use specific selectors to reduce DOM traversal
- Cache expensive computations
- Avoid complex regex patterns in hot paths

```javascript
// Good: Specific and efficient
const priceElements = element.querySelectorAll('.price, [data-price]');

// Avoid: Too broad and slow
const allElements = element.querySelectorAll('*');
```

### Confidence Tuning

Set appropriate confidence levels:

- **High confidence (0.9+)**: Structured data, known formats
- **Medium confidence (0.7-0.9)**: Well-tested patterns
- **Low confidence (0.5-0.7)**: Experimental or ambiguous patterns

## Best Practices

### 1. Pattern Naming

Use descriptive, consistent names:

```javascript
// Good
'amazon-split-price'
'euro-space-separated'
'contextual-under-price'

// Avoid  
'pattern1'
'myPattern'
'test'
```

### 2. Error Handling

Always include error handling:

```javascript
export function matchPattern(text) {
  try {
    if (!text || typeof text !== 'string') return [];
    
    // Pattern logic here
    
  } catch (error) {
    console.warn('Pattern matching error:', error);
    return [];
  }
}
```

### 3. Documentation

Document all patterns thoroughly:

```javascript
/**
 * Matches European price format with comma decimal separator
 * Examples: "25,99 €", "€ 25,99", "1.234,56€"
 * 
 * @param {string} text - Text to analyze
 * @returns {Array<PatternMatch>} Array of matches
 */
```

### 4. Testing

Test with real-world examples:

```javascript
// Test with actual site content
const testCases = [
  'Price: $25.99',           // Standard case
  'Sale: $19.99 (was $29.99)', // Complex case
  'From $12.99',             // Contextual case
  '$1,299.00',               // Large amount
  'Invalid text',            // No match case
];
```

## Debugging

### Enable Debug Mode

```javascript
// Enable detailed logging
const result = await extractPrice(element, { 
  debug: true,
  returnMultiple: true 
});

// Check debug output
console.log('Strategies attempted:', result.debugInfo.strategies);
console.log('Confidence scores:', result.debugInfo.confidences);
```

### Debug Output Analysis

Look for these indicators:

- Pattern attempted but no matches
- Low confidence scores
- Strategy not being called
- Performance issues

## Common Patterns Reference

### Currency Formats

```javascript
// US Dollar: $25.99, $1,299.00
/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g

// Euro: €25.99, 25.99€, 25,99 €
/(€\s*)?(\d+(?:[.,]\d{2,3})?)\s*(€)?/g

// British Pound: £25.99
/£(\d+(?:\.\d{2})?)/g

// Yen: ¥2500, 2500円
/[¥円]\s*(\d{1,3}(?:,\d{3})*)/g
```

### Contextual Patterns

```javascript
// "Under $X", "From $X", "Starting at $X"
/(under|from|starting\s+at)\s+\$(\d+(?:\.\d{2})?)/gi

// "Save $X", "Discount $X"  
/(save|discount)\s+\$(\d+(?:\.\d{2})?)/gi

// "Up to $X off"
/up\s+to\s+\$(\d+(?:\.\d{2})?)\s+off/gi
```

This guide provides everything needed to successfully extend the price detection system with new patterns and capabilities.