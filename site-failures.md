# Site-Specific Failure Analysis

## Analysis Methodology

Each problem site was analyzed using the following approach:

1. Load test HTML pages created for each site
2. Trace price detection flow through current system
3. Identify exact failure points in the detection pipeline
4. Document required changes to support each site

## Gearbest.com Analysis

### Site Characteristics

- **Domain**: gearbest.com (electronics/gadgets e-commerce)
- **Primary Markets**: International, USD/EUR pricing
- **Price Patterns**: Mixed standard and custom formats

### HTML Structure Analysis

**Test Case 1: Standard Format (WORKS)**

```html
<div class="goods-price">$4.99</div>
```

- **Detection Result**: ✅ SUCCESS
- **Pattern Match**: Standard `$\d+\.\d+` pattern
- **Flow**: mightContainPrice() → findPrices() → pattern match → success

**Test Case 2: Separated Currency/Value (FAILS)**

```html
<div class="goods-price">
  <span class="currency">US$</span>
  <span class="value">34.56</span>
</div>
```

- **Detection Result**: ❌ FAILURE
- **Failure Point**: `mightContainPrice()` called on individual text nodes
- **Issue 1**: "US$" not in CURRENCY_SYMBOL_TO_FORMAT mapping
- **Issue 2**: "34.56" alone fails currency symbol check
- **Issue 3**: No DOM structure analysis to combine related elements

**Test Case 3: Country Code Prefix (FAILS)**

```html
<div class="goods-price">US$ 18.88</div>
```

- **Detection Result**: ❌ FAILURE
- **Failure Point**: Pattern matching in `findPrices()`
- **Issue**: "US$" country code prefix not supported in current patterns
- **Required Pattern**: `[A-Z]{2}\$\s*\d+(?:[.,]\d{1,2})?`

**Test Case 4: Price Range (PARTIAL FAILURE)**

```html
<div class="goods-price">$25.99 - $45.99</div>
```

- **Detection Result**: ⚠️ PARTIAL (detects individual prices, not range)
- **Issue**: Current patterns match "$25.99" and "$45.99" separately
- **Missing**: Range-aware pattern and conversion logic

### Gearbest-Specific Requirements

**1. Country Code Currency Support**

```javascript
// Required addition to CURRENCY_SYMBOL_TO_FORMAT:
'US$': 'US',
'CA$': 'US',
'AU$': 'US',
'HK$': 'US'

// Required new pattern:
/[A-Z]{2}\$\s*\d+(?:[.,]\d{1,2})?/
```

**2. DOM Structure Analysis**

```javascript
// Required: Combine text from related price elements
function analyzeGearbestPrice(element) {
  // Look for currency + value span combinations
  const currencySpan = element.querySelector('.currency');
  const valueSpan = element.querySelector('.value');

  if (currencySpan && valueSpan) {
    return currencySpan.textContent + valueSpan.textContent;
  }

  return element.textContent;
}
```

**3. Site Configuration**

```javascript
const GEARBEST_CONFIG = {
  domain: 'gearbest.com',
  priceSelectors: ['.goods-price', '.my-shop-price'],
  patterns: ['standard', 'countryPrefixed', 'ranges'],
  structureAnalysis: true,
};
```

## Cdiscount.com Analysis

### Site Characteristics

- **Domain**: cdiscount.com (French e-commerce)
- **Primary Market**: France, EUR pricing
- **Price Patterns**: Unique "€" between digits format

### HTML Structure Analysis

**Test Case 1: Cdiscount Special Format (FAILS)**

```html
<div class="price">99€99</div>
```

- **Detection Result**: ❌ CRITICAL FAILURE
- **Failure Point**: Pattern matching - no pattern supports symbol between digits
- **Issue**: All current patterns expect symbol before OR after, not between
- **Required Pattern**: `\d+€\d{2}` (specifically for this format)

**Test Case 2: Alternative Cdiscount Format (FAILS)**

```html
<div class="fpPrice">45€50</div>
```

- **Detection Result**: ❌ SAME ISSUE as above
- **Root Cause**: Same missing pattern for symbol-between-digits

**Test Case 3: Superscript Formatting (FAILS)**

```html
<div class="price">
  <span>129</span>
  <span class="priceSup">€</span>
  <span class="priceSup">95</span>
</div>
```

- **Detection Result**: ❌ COMPLEX FAILURE
- **Issue 1**: Price components in separate elements
- **Issue 2**: Even if combined to "129€95", still missing pattern
- **Required**: DOM structure analysis + new pattern

**Test Case 4: Standard EUR Format (WORKS)**

```html
<div class="price">€ 23,90</div>
```

- **Detection Result**: ✅ SUCCESS
- **Pattern Match**: Standard EUR pattern with space and comma decimal

### Cdiscount Critical Gap Analysis

**The "€" Between Digits Problem:**

```javascript
// Current patterns (all FAIL for "99€99"):
symbolBefore: /€\s*\d+(?:[.,]\d{1,2})?/; // Expects €99.99
symbolAfter: /\d+(?:[.,]\d{1,2})?\s*€/; // Expects 99.99€
codePattern: /EUR\s\d+(?:[.,]\d{1,2})?/; // Expects EUR 99.99

// Missing pattern:
symbolBetween: /\d+€\d{2}/; // Would match 99€99
```

**DOM Structure Challenge:**

```javascript
// Current system processes: ["129", "€", "95"] as separate text nodes
// Required: Combine to "129€95" then apply symbolBetween pattern

function analyzeCdiscountPrice(element) {
  const spans = element.querySelectorAll('span');
  if (spans.length >= 3) {
    // Look for number + currency + number pattern
    const combined = Array.from(spans)
      .map((s) => s.textContent.trim())
      .join('');
    if (/\d+€\d{2}/.test(combined)) {
      return combined;
    }
  }
  return element.textContent;
}
```

### Cdiscount-Specific Requirements

**1. Symbol-Between-Digits Pattern**

```javascript
// New pattern category needed:
SYMBOL_BETWEEN_PATTERNS = {
  euro: /\d+€\d{2}/,
  pound: /\d+£\d{2}/,
  dollar: /\d+\$\d{2}/,
};
```

**2. Price Component Assembly**

```javascript
// DOM analysis to reconstruct split prices:
function combinePriceComponents(element) {
  // Strategy 1: Look for number + symbol + number in child elements
  // Strategy 2: Concatenate adjacent numeric and currency text nodes
  // Strategy 3: Use site-specific selectors
}
```

**3. Site Configuration**

```javascript
const CDISCOUNT_CONFIG = {
  domain: 'cdiscount.com',
  priceSelectors: ['.price', '.fpPrice'],
  patterns: ['standard', 'symbolBetween'],
  structureAnalysis: true,
  customPatterns: {
    symbolBetween: /\d+€\d{2}/,
  },
};
```

## AliExpress.com Analysis

### Site Characteristics

- **Domain**: aliexpress.com (Chinese e-commerce platform)
- **Primary Markets**: Global, multi-currency
- **Price Patterns**: Complex international formats

### HTML Structure Analysis

**Test Case 1: Spaced Country Code (FAILS)**

```html
<div class="product-price-value">US $8.52</div>
```

- **Detection Result**: ❌ FAILURE
- **Failure Point**: Pattern matching - space between country code and symbol
- **Issue**: No pattern for "US $" (space between code and symbol)
- **Required Pattern**: `[A-Z]{2}\s+\$\d+(?:[.,]\d{1,2})?`

**Test Case 2: Price Range (PARTIAL)**

```html
<div class="product-price-value">$2.99 - $15.99</div>
```

- **Detection Result**: ⚠️ PARTIAL (individual prices detected)
- **Issue**: Range format not handled as single unit
- **Current Behavior**: Detects "$2.99" and "$15.99" separately

**Test Case 3: Split Currency Element (FAILS)**

```html
<div class="uniform-banner-box-price">
  <span class="currency">US</span>
  <span>$25.64</span>
</div>
```

- **Detection Result**: ❌ FAILURE
- **Issue 1**: "US" alone is not recognized as currency indicator
- **Issue 2**: "$25.64" detected separately, missing context
- **Required**: DOM structure analysis to combine related elements

**Test Case 4: Spaced Symbol (FAILS)**

```html
<div class="product-price-value">€ 14,32</div>
```

- **Detection Result**: ❌ FAILURE
- **Issue**: Space after currency symbol not in current patterns
- **Required Pattern**: `[€£$¥]\s+\d+(?:[.,]\d{1,2})?`

**Test Case 5: Complex Discount Structure (PARTIAL)**

```html
<div class="price-wrapper">
  <div class="price-original">US $45.00</div>
  <div class="price-sale">
    <span class="product-price-value">US $32.50</span>
    <span class="discount">-28%</span>
  </div>
</div>
```

- **Detection Result**: ⚠️ PARTIAL (fails on "US $" format)
- **Issue**: Multiple price elements not analyzed as group

### AliExpress Multi-Pattern Challenge

**Complex Format Variations:**

```javascript
// AliExpress uses multiple formats simultaneously:
'US $8.52'; // Country code + space + symbol + amount
'$2.99 - $15.99'; // Range format
'€ 14,32'; // Symbol + space + amount
'USD 18.90'; // Standard country code format
'$1.20 / piece'; // Unit pricing
```

**Required Pattern Additions:**

```javascript
const ALIEXPRESS_PATTERNS = {
  spacedCountrySymbol: /[A-Z]{2}\s+[\$€£¥]\d+(?:[.,]\d{1,2})?/,
  spacedSymbol: /[€£$¥]\s+\d+(?:[.,]\d{1,2})?/,
  priceRange: /[\$€£¥]\d+(?:[.,]\d{1,2})?\s*[-–]\s*[\$€£¥]\d+(?:[.,]\d{1,2})?/,
  unitPricing: /[\$€£¥]\d+(?:[.,]\d{1,2})?\s*\/\s*\w+/,
};
```

### AliExpress-Specific Requirements

**1. Multi-Format Pattern Support**

```javascript
const ALIEXPRESS_CONFIG = {
  domain: 'aliexpress.com',
  priceSelectors: ['.product-price-value', '.uniform-banner-box-price', '.price-now'],
  patterns: ['standard', 'spacedCountrySymbol', 'spacedSymbol', 'ranges'],
  structureAnalysis: true,
  multiCurrency: true,
};
```

**2. Range Price Handling**

```javascript
function handlePriceRange(text) {
  const rangePattern = /(\$\d+(?:[.,]\d{1,2})?)\s*[-–]\s*(\$\d+(?:[.,]\d{1,2})?)/;
  const match = text.match(rangePattern);

  if (match) {
    return {
      type: 'range',
      min: match[1],
      max: match[2],
      display: `${match[1]} - ${match[2]}`,
    };
  }

  return null;
}
```

## Cross-Site Pattern Analysis

### Common Failure Patterns

**1. DOM Structure Assumptions (All Sites)**

- Current system assumes prices in single text nodes
- Many sites split prices across multiple elements
- Required: DOM structure analysis for all sites

**2. Pattern Inflexibility (All Sites)**

- Fixed patterns miss format variations
- No progressive relaxation of constraints
- Required: Multi-pass detection strategy

**3. Country/Cultural Variations (Gearbest, AliExpress)**

- Missing country code prefixes (US$, CA$, etc.)
- Space variations not handled
- Required: Flexible country code patterns

**4. Site-Specific Formats (Cdiscount)**

- Unique formats like "99€99" completely unsupported
- No mechanism for site-specific pattern additions
- Required: Configurable pattern system

### Universal Enhancement Requirements

**1. Enhanced Pattern Registry**

```javascript
const PATTERN_REGISTRY = {
  standard: [...],
  countryPrefixed: [...],
  symbolBetween: [...],
  spaced: [...],
  ranges: [...]
};
```

**2. Site Configuration System**

```javascript
const SITE_CONFIGS = {
  'gearbest.com': { patterns: ['standard', 'countryPrefixed'] },
  'cdiscount.com': { patterns: ['standard', 'symbolBetween'] },
  'aliexpress.com': { patterns: ['standard', 'spaced', 'ranges'] },
};
```

**3. DOM Structure Analyzer**

```javascript
function analyzePriceStructure(element) {
  // Combine text from price-related child elements
  // Handle split currency/value patterns
  // Reconstruct complete price strings
}
```

**4. Multi-Pass Detection**

```javascript
function findPricesEnhanced(text, settings) {
  // Pass 1: Standard patterns
  // Pass 2: Relaxed patterns (if Pass 1 fails)
  // Pass 3: Contextual patterns (if Pass 2 fails)
}
```

## Implementation Priority

### Critical Path (Must Fix)

1. **Cdiscount Symbol-Between Pattern**: Completely blocks Cdiscount support
2. **DOM Structure Analysis**: Required for all problematic sites
3. **Country Code Patterns**: Blocks many Gearbest/AliExpress prices

### High Priority (Major Impact)

1. **Spaced Currency Patterns**: Common on AliExpress
2. **Site Configuration System**: Enables targeted fixes
3. **Multi-Pass Detection**: Improves overall reliability

### Medium Priority (Quality of Life)

1. **Range Pattern Support**: Better UX for price ranges
2. **Unit Pricing Patterns**: Handle "/piece" type formats
3. **Performance Optimization**: Ensure enhancements don't slow system

This analysis provides the specific technical requirements needed to resolve price detection failures on all problem sites.
