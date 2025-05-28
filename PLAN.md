# Implementation Plan: Resolve Critical Site-Specific Failures

## Executive Summary

The extension currently fails to detect and convert prices on various e-commerce sites like gearbest.com. This plan outlines a comprehensive approach to improve price detection reliability across diverse websites by enhancing pattern recognition, implementing fallback strategies, and adding better debugging capabilities.

## Architecture Analysis

### Current State

1. **Price Detection Flow**:

   - `priceFinder.js` uses simple heuristics to detect potential prices
   - Site-specific handlers exist for Amazon and eBay
   - Generic attribute-based detection as fallback
   - Pattern relies on currency symbols/codes being present

2. **Limitations Identified**:
   - Over-reliance on currency symbols being adjacent to numbers
   - No handling of complex price formats (e.g., "99€99", price ranges)
   - Limited pattern matching for different cultural formats
   - No learning or adaptation from failed detections

### Root Cause Analysis

Based on the gearbest.com example and other reported issues:

1. **Pattern Rigidity**: Current regex patterns are too strict
2. **Currency Detection**: Fails when currency indicators are separated from numbers
3. **DOM Structure**: Doesn't handle prices split across multiple elements
4. **Format Variations**: Can't handle unconventional formats (99€99, ranges)

## Technical Approach

### Approach 1: Enhanced Pattern Recognition (Selected ✓)

**Pros:**

- Maintains current architecture
- Backward compatible
- Incremental improvements possible
- Lower risk of breaking existing functionality

**Cons:**

- May still miss edge cases
- Requires extensive pattern testing

**Implementation:**

1. Expand pattern recognition in `priceFinder.js`
2. Add flexible currency detection
3. Implement DOM structure analysis
4. Create site-specific pattern configurations

### Approach 2: Machine Learning Based Detection

**Pros:**

- Could learn from failures
- Adaptive to new formats

**Cons:**

- Complex implementation
- Performance overhead
- Requires training data
- Over-engineering for current needs

### Approach 3: Crowd-Sourced Pattern Database

**Pros:**

- Community-driven improvements
- Could handle any site

**Cons:**

- Requires infrastructure
- Privacy concerns
- Maintenance overhead

## Detailed Implementation Plan

### Phase 1: Enhanced Pattern Recognition

#### 1.1 Improve Price Pattern Detection

```javascript
// Enhanced pattern builder in priceFinder.js
const PRICE_PATTERNS = {
  // Standard patterns
  symbolBefore: /[$€£¥₹₽¢]\s*\d+(?:[.,]\d{1,2})?/,
  symbolAfter: /\d+(?:[.,]\d{1,2})?\s*[$€£¥₹₽¢]/,

  // Separated patterns (e.g., "USD 34.56")
  codeBefore: /[A-Z]{3}\s+\d+(?:[.,]\d{1,2})?/,
  codeAfter: /\d+(?:[.,]\d{1,2})?\s+[A-Z]{3}/,

  // Special formats
  cdiscount: /\d+[€£$]\d{2}/, // 99€99
  range: /\d+(?:[.,]\d{1,2})?\s*[-–]\s*\d+(?:[.,]\d{1,2})?/, // 20-25

  // Flexible patterns
  contextual: /(?:price|cost|total|subtotal|€|£|\$|¥)[\s:]*\d+(?:[.,]\d{1,2})?/i,
};
```

#### 1.2 DOM Structure Analysis

```javascript
// New module: src/content/structureAnalyzer.js
export function analyzePriceStructure(element) {
  // Check if price is split across child elements
  const priceElements = element.querySelectorAll('[class*="price"], [id*="price"]');

  // Combine text from related elements
  const combinedText = Array.from(priceElements)
    .map((el) => el.textContent.trim())
    .join(' ');

  return combinedText;
}
```

#### 1.3 Site-Specific Configurations

```javascript
// New file: src/content/siteConfigs.js
export const SITE_CONFIGS = {
  'gearbest.com': {
    priceSelectors: ['.goods-price', '.my-shop-price'],
    currencyPosition: 'before',
    patterns: ['symbolBefore', 'contextual'],
  },
  'cdiscount.com': {
    patterns: ['cdiscount'],
    priceSelectors: ['.price'],
  },
  'aliexpress.com': {
    priceSelectors: ['.product-price-value'],
    patterns: ['symbolBefore', 'range'],
  },
};
```

### Phase 2: Fallback Strategies

#### 2.1 Multi-Pass Detection

```javascript
// Enhanced findPrices function
export const findPrices = (text, settings = null) => {
  // First pass: Standard detection
  let result = standardDetection(text, settings);

  // Second pass: Relaxed patterns if first fails
  if (!result.hasPotentialPrice) {
    result = relaxedDetection(text, settings);
  }

  // Third pass: Context-based detection
  if (!result.hasPotentialPrice) {
    result = contextualDetection(text, settings);
  }

  return result;
};
```

#### 2.2 Element Context Analysis

```javascript
// Analyze parent elements for price context
function getElementContext(textNode) {
  const parent = textNode.parentElement;
  if (!parent) return null;

  // Check class/id attributes
  const classList = parent.className.toLowerCase();
  const id = parent.id.toLowerCase();

  const priceIndicators = ['price', 'cost', 'amount', 'total'];
  return priceIndicators.some(
    (indicator) => classList.includes(indicator) || id.includes(indicator)
  );
}
```

### Phase 3: Testing & Validation

#### 3.1 Test Suite Enhancement

- Add test cases for all reported failing sites
- Create visual regression tests
- Implement performance benchmarks

#### 3.2 Debug Mode Improvements

```javascript
// Enhanced debug information
export function debugPriceDetection(element, detection) {
  if (!debugMode) return;

  console.group('Price Detection Debug');
  console.log('Element:', element);
  console.log('Text:', element.textContent);
  console.log('Detection Result:', detection);
  console.log('Patterns Tried:', detection.patternsTried);
  console.log('Site Config:', getSiteConfig(window.location.hostname));
  console.groupEnd();
}
```

## Testing Strategy

### Unit Tests

1. **Pattern Matching Tests**

   - Test each pattern variant
   - Edge cases (99€99, ranges, etc.)
   - Different cultural formats

2. **Site-Specific Tests**
   - Mock DOM structures from failing sites
   - Verify detection accuracy

### Integration Tests

1. **Full Page Processing**

   - Load test pages for each problem site
   - Verify end-to-end conversion

2. **Performance Tests**
   - Measure impact of enhanced detection
   - Ensure no regression on working sites

### Manual Testing

1. Test on actual problem sites:
   - gearbest.com
   - cdiscount.com
   - aliexpress.com
   - Amazon product lists

## Implementation Steps

1. **Setup & Infrastructure** (2 hours)

   - Create feature branch
   - Set up test infrastructure
   - Add debug tooling

2. **Pattern Enhancement** (4 hours)

   - Implement enhanced patterns
   - Add pattern builder tests
   - Integrate with existing code

3. **DOM Analysis** (3 hours)

   - Create structure analyzer
   - Implement element context detection
   - Add fallback strategies

4. **Site Configurations** (2 hours)

   - Create configuration system
   - Add initial site configs
   - Test on problem sites

5. **Testing & Validation** (3 hours)

   - Write comprehensive tests
   - Manual testing on all sites
   - Performance validation

6. **Documentation & Cleanup** (1 hour)
   - Update documentation
   - Code review prep
   - Final testing

## Risk Mitigation

### Performance Impact

- **Risk**: Enhanced detection could slow down page processing
- **Mitigation**:
  - Implement pattern caching
  - Use early exit strategies
  - Profile and optimize hot paths

### False Positives

- **Risk**: Relaxed patterns might detect non-prices
- **Mitigation**:
  - Context validation
  - Confidence scoring
  - User feedback mechanism

### Breaking Changes

- **Risk**: Changes might break existing functionality
- **Mitigation**:
  - Comprehensive test coverage
  - Feature flags for gradual rollout
  - Backward compatibility layer

## Monitoring & Observability

### Logging Enhancements

```javascript
logger.info('Price detection attempt', {
  url: window.location.href,
  pattern: patternUsed,
  success: detectionResult,
  timeMs: processingTime,
});
```

### Metrics Collection

- Detection success rate by site
- Processing time per page
- Pattern effectiveness

## Security Considerations

### Input Validation

- Sanitize all text before pattern matching
- Limit processing on extremely large nodes
- Validate currency conversions

### Performance Bounds

- Set maximum processing time
- Limit pattern complexity
- Implement circuit breakers

## Open Questions

1. **Currency API Integration**: Should we integrate with a currency API for better code detection?
2. **User Preferences**: Should users be able to add custom patterns for specific sites?
3. **Crowdsourcing**: Is there interest in a community pattern database?
4. **Machine Learning**: Should we collect anonymized detection data for future ML training?

## Success Metrics

1. **Primary**: Extension works on all test sites (gearbest, cdiscount, aliexpress)
2. **Secondary**: No performance regression on existing sites
3. **Tertiary**: Reduced bug reports for price detection failures

## Next Steps

1. Review and approve this plan
2. Create detailed tickets for each implementation phase
3. Begin implementation with Phase 1 pattern enhancements
4. Set up testing infrastructure
