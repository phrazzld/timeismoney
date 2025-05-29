# REVISED TODO: Enhanced Price Detection Based on Real-World Examples

## Critical Discoveries from Real HTML

1. **Cdiscount uses "449€ 00" format**, not "99€99" - cents in separate span
2. **Amazon splits prices across 4+ elements** with aria-labels
3. **Gearbest nests currency symbols** in child spans
4. **Many sites use attributes** (aria-label, data-\*) for prices
5. **Contextual prices** ("Under $20", "from $2.99") are common

## Revised Phase 1: DOM Structure Analysis (NEW PRIORITY)

### TASK-004A: Create DOM structure analyzer (REVISED)

- [ ] Create `src/content/domPriceAnalyzer.js` module
- [ ] Implement attribute-based extraction (aria-label, data-\*)
- [ ] Handle split price components across multiple elements
- [ ] Support currency symbols in child elements
- [ ] Extract text from nested structures intelligently
- **Dependencies**: TASK-003
- **Verification**: Correctly extracts all examples.md prices
- **Time**: 3 hours

### TASK-004B: Create element combination strategies

- [ ] Implement smart text combination from child nodes
- [ ] Handle "449€ 00" split format for Cdiscount
- [ ] Handle Amazon's symbol/whole/fraction split
- [ ] Handle Gearbest's nested currency symbols
- [ ] Preserve proper spacing between components
- **Dependencies**: TASK-004A
- **Verification**: Unit tests for each example format
- **Time**: 2 hours

## Revised Phase 2: Enhanced Pattern Recognition

### TASK-005A: Create comprehensive pattern library

- [ ] Add patterns for space variations (272.46 €, € 14,32)
- [ ] Add split component patterns (449€ 00)
- [ ] Add contextual patterns (Under $X, from $X)
- [ ] Add comma thousand separators ($2,500,000)
- [ ] Support attribute-extracted text patterns
- **Dependencies**: TASK-004B
- **Verification**: Pattern tests for all examples.md formats
- **Time**: 2 hours

### TASK-005B: Implement pattern selection logic

- [ ] Auto-detect best pattern based on found elements
- [ ] Try multiple patterns in order of likelihood
- [ ] Handle pattern failures gracefully
- [ ] Log pattern attempts for debugging
- **Dependencies**: TASK-005A
- **Verification**: Correct pattern selection for each site
- **Time**: 1.5 hours

## Revised Phase 3: Site-Specific Enhancements

### TASK-006A: Create site handler framework

- [ ] Create `src/content/siteHandlers.js` module
- [ ] Define handler interface for custom extraction
- [ ] Implement plugin system for site-specific logic
- [ ] Support both CSS selectors and extraction functions
- **Dependencies**: TASK-005B
- **Verification**: Framework supports all example sites
- **Time**: 2 hours

### TASK-006B: Implement specific site handlers

- [ ] Amazon handler: aria-label + split components
- [ ] Cdiscount handler: split euro format
- [ ] eBay handler: handle strikethrough/hidden prices
- [ ] Gearbest handler: nested currency symbols
- [ ] Zillow handler: comma thousands
- **Dependencies**: TASK-006A
- **Verification**: Each handler extracts its examples correctly
- **Time**: 3 hours

## Revised Phase 4: Integration and Fallback

### TASK-007A: Integrate DOM analysis with price finder

- [ ] Modify `findPrices` to use DOM analyzer first
- [ ] Fall back to text-based detection
- [ ] Combine results from multiple strategies
- [ ] Maintain backward compatibility
- **Dependencies**: TASK-006B
- **Verification**: Existing + new tests pass
- **Time**: 2 hours

### TASK-007B: Implement multi-pass detection

- [ ] Pass 1: Site-specific handler
- [ ] Pass 2: DOM structure analysis
- [ ] Pass 3: Attribute extraction
- [ ] Pass 4: Text pattern matching
- [ ] Pass 5: Contextual patterns
- **Dependencies**: TASK-007A
- **Verification**: Each pass tested independently
- **Time**: 2 hours

## Phase 5: Testing with Real Examples

### TASK-008: Create test suite from examples.md

- [ ] Convert each example to a test case
- [ ] Test both detection and conversion
- [ ] Verify no false positives
- [ ] Performance benchmarks
- **Dependencies**: TASK-007B
- **Verification**: 100% of examples.md prices detected
- **Time**: 2 hours

## Critical Implementation Notes

### DOM-First Approach

Unlike our original plan which focused on regex patterns, we need a **DOM-first approach**:

1. Analyze element structure
2. Check attributes (aria-label, data-\*)
3. Combine child elements intelligently
4. THEN apply text patterns

### Pattern Flexibility

Patterns must handle:

- Space variations (before/after currency)
- Split components (currency/amount in different elements)
- Nested structures (currency symbol as child)
- Contextual phrases ("Under", "from")

### Site-Specific Knowledge

Each major site needs custom handling:

- **Amazon**: aria-label + component assembly
- **Cdiscount**: split euro format
- **eBay**: multiple price representations
- **Gearbest**: WooCommerce structure

## Success Metrics

1. **Primary**: All examples.md prices detected and converted
2. **Secondary**: No regression on existing functionality
3. **Tertiary**: Performance impact < 10%
4. **Bonus**: Framework extensible for new sites

## Removed/Deprioritized Tasks

- Original TASK-004 (pattern-only approach) - replaced with DOM analysis
- Original site configs - replaced with active handlers
- Manual test pages - use real examples instead

This revised approach addresses the **actual** complexity found in real-world e-commerce sites rather than our simplified assumptions.
