# Pattern Schema Documentation

## Overview

The enhanced price detection system uses a flexible pattern-based approach to identify prices in various formats. This document describes the structure and configuration of price patterns.

## Pattern Object Structure

### Basic Pattern Object

```javascript
{
  value: string,           // Numeric value (e.g., "25.99")
  currency: string,        // Currency symbol or code (e.g., "$", "EUR")
  original: string,        // Original matched text (e.g., "$25.99")
  confidence: number,      // Confidence score (0.0 - 1.0)
  pattern: string,         // Pattern identifier used
  source: string,          // Source of detection (e.g., "text", "aria-label")
  strategy: string         // Strategy used (e.g., "attribute", "structure")
}
```

### Enhanced Pattern Object

```javascript
{
  // Basic fields (above)
  ...basicPattern,
  
  // Enhanced metadata
  metadata: {
    extractionMethod: string,    // Method used ("attribute", "structure", "pattern")
    contextData: object,         // Additional context information
    elementType: string,         // DOM element type if applicable
    confidence: number,          // Detailed confidence metrics
    performanceMetrics: object   // Timing and performance data
  },
  
  // DOM-specific fields
  element: Element,              // Source DOM element (if applicable)
  text: string,                  // Display text for the price
  position: object               // Position information in document
}
```

## Pattern Types

### 1. Text Patterns

Standard text-based price patterns for common formats:

```javascript
// Dollar amounts: $25.99, $1,299.00
{
  pattern: "currency-before-decimal",
  regex: /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
  confidence: 0.9
}

// Euro amounts: 25.99€, €25.99
{
  pattern: "euro-flexible",
  regex: /(€\s*)?(\d+(?:[.,]\d{2})?)(\s*€)?/g,
  confidence: 0.85
}
```

### 2. DOM Attribute Patterns

Patterns for extracting prices from HTML attributes:

```javascript
{
  pattern: "aria-label-price",
  selector: "[aria-label*='price'], [aria-label*='$'], [aria-label*='€']",
  extractor: "getAttribute",
  confidence: 0.95
}
```

### 3. Split Component Patterns

Patterns for prices split across multiple DOM elements:

```javascript
{
  pattern: "split-currency-amount",
  structure: {
    currency: ".currency-symbol",
    dollars: ".price-dollars", 
    cents: ".price-cents"
  },
  confidence: 0.9
}
```

### 4. Contextual Patterns

Patterns for contextual price expressions:

```javascript
{
  pattern: "under-price",
  regex: /under\s+\$(\d+(?:\.\d{2})?)/gi,
  confidence: 0.7,
  context: "maximum_price"
}
```

## Confidence Scoring

### Confidence Levels

- **0.95-1.0**: High confidence (structured data, aria-labels)
- **0.85-0.94**: Good confidence (standard patterns)
- **0.70-0.84**: Moderate confidence (contextual patterns)
- **0.50-0.69**: Low confidence (ambiguous patterns)
- **Below 0.50**: Usually filtered out

### Confidence Factors

1. **Source reliability**: Structured data > Attributes > Text content
2. **Pattern specificity**: Exact matches > Flexible patterns
3. **Context validation**: E-commerce context > General context
4. **Site-specific knowledge**: Known sites > Unknown sites

## Pattern Configuration

### Site Handler Configuration

```javascript
const siteHandler = {
  name: "site-name",
  domains: ["example.com"],
  priority: 1,
  
  patterns: [
    {
      name: "primary-price",
      selector: ".price-main",
      confidence: 0.95
    },
    {
      name: "sale-price", 
      selector: ".price-sale",
      confidence: 0.9
    }
  ],
  
  fallbacks: [
    {
      pattern: "aria-label-extraction",
      confidence: 0.85
    }
  ]
}
```

### Pattern Validation

```javascript
function validatePattern(pattern) {
  // Required fields
  if (!pattern.value || !pattern.currency) {
    return false;
  }
  
  // Confidence range
  if (pattern.confidence < 0 || pattern.confidence > 1) {
    return false;
  }
  
  // Value format
  if (!/^\d+(?:\.\d{2})?$/.test(pattern.value)) {
    return false;
  }
  
  return true;
}
```

## Integration Points

### Multi-Pass Detection

1. **Pass 1**: Site-specific handlers (highest confidence)
2. **Pass 2**: DOM attribute extraction  
3. **Pass 3**: DOM structure analysis
4. **Pass 4**: Enhanced pattern matching
5. **Pass 5**: Contextual patterns (lowest confidence)

### Pattern Selection Strategy

```javascript
function selectBestPattern(candidates) {
  return candidates
    .filter(p => p.confidence >= 0.5)  // Minimum threshold
    .sort((a, b) => b.confidence - a.confidence)  // Highest first
    .slice(0, 5);  // Top 5 candidates
}
```

## Examples

### Complete Pattern Detection Flow

```javascript
// Input: DOM element containing "$25.99"
const element = document.querySelector('.price');

// Detection result
const result = {
  value: "25.99",
  currency: "$", 
  original: "$25.99",
  confidence: 0.92,
  pattern: "currency-before-decimal",
  source: "text-content",
  strategy: "pattern-matching",
  metadata: {
    extractionMethod: "text-analysis",
    elementType: "span",
    confidence: {
      pattern: 0.95,
      context: 0.89
    }
  }
}
```

This schema provides the foundation for the flexible, accurate price detection system used throughout the application.