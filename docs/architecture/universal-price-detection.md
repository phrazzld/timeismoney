# Universal Price Detection Architecture

## Overview

TimeIsMoney uses a universal price detection system that works across all websites without domain-specific logic. This approach ensures that price patterns discovered on one site automatically work everywhere.

## Core Principles

### 1. Universal Pattern Recognition
All price patterns are universal. A pattern like "449€ 00" found on Cdiscount is equally valid on any other website. The system doesn't check domains - it simply looks for price patterns everywhere.

### 2. Currency Filtering
The extension only converts prices in the user's selected currency:
- User selects USD → Only $ prices are converted to time
- User selects EUR → Only € prices are converted to time
- Other currencies are left untouched

### 3. Multiple Extraction Strategies
The universal price extractor combines multiple strategies:

#### DOM-Based Extraction
- Searches for prices in element attributes (aria-label, data-price, etc.)
- Analyzes nested DOM structures
- Detects split price components across multiple elements

#### Pattern-Based Extraction  
- Regular expressions for standard formats ($25.99, €30.00)
- Split price patterns (449€ 00)
- Contextual patterns ("Under $20", "from $2.99")
- Space variations (€ 14,32)

#### Nested Currency Detection
- Adjacent elements with currency and value
- Class-based patterns (currency/value/amount classes)
- Flexible ordering (currency before or after number)

## Architecture Components

### universalPriceExtractor.js
The main module that coordinates all extraction strategies:
```javascript
export function extractPrices(element, settings) {
  // 1. DOM-based extraction
  // 2. Split price extraction  
  // 3. Nested currency extraction
  // 4. Contextual price extraction
  // 5. Standard pattern matching
  // 6. Currency filtering
}
```

### domScanner.js
Traverses the DOM and applies the universal extractor:
```javascript
// Try universal price extraction first
specialHandlerProcessed = processWithUniversalExtractor(
  child,
  callback,
  settings
);
```

### Pattern Libraries
- `pricePatterns.js` - Advanced pattern matching
- `domPriceAnalyzer.js` - DOM structure analysis
- `attributeDetector.js` - Attribute-based detection

## Benefits

### Simplicity
- One extraction system instead of N site-specific handlers
- No domain checking or routing logic
- Cleaner, more maintainable codebase

### Coverage
- Automatically works on new websites
- Patterns discovered anywhere benefit all sites
- No need to add new site handlers

### Performance
- No domain matching overhead
- Single extraction path
- Efficient pattern reuse

### Future-Proof
- New e-commerce sites work automatically
- Pattern additions benefit all sites
- Easy to extend with new patterns

## Migration from Site-Specific Approach

The system previously used site-specific handlers that checked domains before applying patterns. This approach had several problems:

1. **Limited Coverage** - Patterns only worked on registered domains
2. **Maintenance Burden** - Each new site required a new handler
3. **Duplicated Logic** - Same patterns implemented multiple times
4. **Performance Overhead** - Domain checking on every element

The universal approach solves all these issues by treating patterns as universal from the start.

## Testing Strategy

### Universal Pattern Tests
All patterns are tested on generic HTML without domain context:
```javascript
it('should detect split price format on any website', () => {
  const html = '<div class="random-website">449€ 00</div>';
  // Pattern works regardless of class names or site context
});
```

### Examples Verification
The `examples.md` file contains real-world price patterns from various sites. All these patterns are tested to work universally, proving that site-specific logic is unnecessary.

## Future Enhancements

### Multi-Currency Support
- Allow conversion between currencies
- Real-time exchange rates
- User preference for display currency

### Pattern Learning
- Automatic pattern discovery
- Machine learning for price detection
- Community-contributed patterns

### Performance Optimization
- Lazy pattern compilation
- Price caching
- Incremental DOM updates