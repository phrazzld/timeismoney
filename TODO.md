# TODO: Resolve Critical Site-Specific Price Detection Failures

## Critical Updates Based on Real Examples (examples.md)

**Major Discovery**: Real-world prices are often split across multiple DOM elements, use attributes like aria-label, and have formats we didn't anticipate:

- Cdiscount: "449€ 00" (not "99€99") with cents in separate span
- Amazon: Prices in aria-label or split across 4+ spans
- Gearbest: Currency symbol in nested child element
- Context prices: "Under $20", "from $2.99"

**New Priority**: DOM analysis BEFORE pattern matching

## Phase 0: Setup & Analysis (Prerequisites)

### TASK-001: Set up feature branch and test infrastructure

- [x] Create feature branch `feature/enhanced-price-detection` (using existing branch)
- [x] Set up test pages for failing sites (gearbest, cdiscount, aliexpress)
- [x] Create test harness for price detection testing
- [x] Add debug logging infrastructure
- **Verification**: Branch created, test infrastructure ready
- **Time**: 30 minutes

### TASK-002: Analyze current price detection implementation

- [x] Deep dive into `priceFinder.js` current implementation
- [x] Document current pattern limitations
- [x] Identify exact failure points for problem sites
- [x] Create baseline performance metrics
- **Dependencies**: TASK-001
- **Verification**: Analysis document with findings
- **Time**: 1 hour

### TASK-003: Write tests for current price detection behavior

- [x] Create unit tests for existing `findPrices` function
- [x] Add tests that demonstrate current failures
- [x] Add tests from real examples.md HTML snippets
- [x] Test DOM-based price extraction scenarios
- **Dependencies**: TASK-002
- **Verification**: Tests pass for working cases, fail for known issues ✓
- **Time**: 1.5 hours (actual: 2 hours)

## Phase 1: DOM Analysis & Pattern Recognition

### TASK-004: Create DOM price analyzer module (CRITICAL - NEW PRIORITY)

- [x] Create `src/content/domPriceAnalyzer.js` module
- [x] Implement attribute-based extraction (aria-label, data-\*)
- [x] Handle split components (Amazon's multi-span prices)
- [x] Support nested currency symbols (Gearbest's structure)
- [x] Extract and combine text from complex DOM structures
- **Dependencies**: TASK-003 ✓
- **Verification**: Correctly extracts all examples.md prices ✓
- **Time**: 3 hours (actual: 4 hours)

### TASK-005: Create enhanced pattern library for real formats

- [x] Create `src/content/pricePatterns.js` with real-world patterns
- [x] Add patterns for space variations (272.46 €, € 14,32)
- [x] Add split component patterns (449€ 00 for Cdiscount)
- [x] Add contextual patterns (Under $X, from $X)
- [x] Add comma thousand separators ($2,500,000)
- **Dependencies**: TASK-004
- **Verification**: Patterns match all examples.md formats
- **Time**: 2 hours

### TASK-006: Create site-specific handlers module

- [x] Create `src/content/siteHandlers.js`
- [x] Amazon handler: aria-label + split price components
- [x] Cdiscount handler: "449€ 00" split format
- [x] eBay handler: multiple price representations
- [x] Gearbest handler: nested currency in child spans
- **Dependencies**: TASK-005
- **Verification**: Each handler extracts its examples correctly
- **Time**: 3 hours

### TASK-007: Test DOM analyzer with real examples

- [x] Create test suite from examples.md HTML snippets
- [x] Test attribute extraction (aria-label)
- [x] Test multi-element price assembly
- [x] Test nested currency symbol handling
- [x] Verify all real examples are correctly extracted
- **Dependencies**: TASK-006
- **Verification**: 100% of examples.md prices extracted
- **Time**: 2 hours

### TASK-008: Create unified price extraction pipeline

- [x] Create `src/content/priceExtractor.js`
- [x] Integrate DOM analyzer as primary strategy
- [x] Fall back to pattern matching for simple cases
- [x] Apply site-specific handlers when available
- [x] Support multiple extraction strategies in order
- **Dependencies**: TASK-004, TASK-006
- **Verification**: Pipeline handles all example types
- **Time**: 2 hours

### TASK-009: Integrate new extraction into priceFinder

- [ ] Modify `findPrices` to use new extraction pipeline
- [ ] Add DOM element parameter alongside text
- [ ] Maintain backward compatibility for text-only
- [ ] Log extraction strategy used for debugging
- **Dependencies**: TASK-008
- **Verification**: Existing + new tests pass
- **Time**: 2 hours

## Phase 2: Multi-Strategy Detection

### TASK-010: Implement multi-pass detection with DOM priority

- [ ] Pass 1: Site-specific handler (if available)
- [ ] Pass 2: DOM attribute extraction (aria-label, data-\*)
- [ ] Pass 3: DOM structure analysis (split components)
- [ ] Pass 4: Enhanced pattern matching on extracted text
- [ ] Pass 5: Contextual patterns (Under $X, from $X)
- **Dependencies**: TASK-009
- **Verification**: Each pass tested independently
- **Time**: 2 hours

### TASK-011: Add element context analysis

- [ ] Implement `getElementContext` function
- [ ] Add parent element inspection logic
- [ ] Check for price-related class/id attributes
- [ ] Integrate with detection passes
- **Dependencies**: TASK-010
- **Verification**: Context analysis tests
- **Time**: 1 hour

### TASK-012: Create fallback strategy tests

- [ ] Write integration tests for multi-pass detection
- [ ] Test fallback behavior on failing examples
- [ ] Verify no false positives
- [ ] Ensure performance within bounds
- **Dependencies**: TASK-010, TASK-011
- **Verification**: All fallback tests pass
- **Time**: 1 hour

## Phase 3: Testing & Validation

### TASK-013: Test with real examples.md cases

- [ ] Convert examples.md to automated test cases
- [ ] Test Cdiscount "449€ 00" split format
- [ ] Test Amazon aria-label and split components
- [ ] Test Gearbest nested currency symbols
- [ ] Test contextual prices (Under $X)
- **Dependencies**: TASK-012
- **Verification**: All examples detected correctly
- **Time**: 2 hours

### TASK-014: Implement debug mode enhancements

- [ ] Create `debugPriceDetection` function
- [ ] Add detailed logging for pattern attempts
- [ ] Include site config information
- [ ] Add performance timing data
- **Dependencies**: TASK-012
- **Verification**: Debug output is comprehensive
- **Time**: 1 hour

### TASK-015: Performance validation

- [ ] Run performance benchmarks on enhanced detection
- [ ] Compare with baseline metrics
- [ ] Optimize hot paths if needed
- [ ] Document performance impact
- **Dependencies**: TASK-014
- **Verification**: Performance within 10% of baseline
- **Time**: 1 hour

### TASK-016: Integration testing on real sites

- [ ] Test on live gearbest.com
- [ ] Test on live cdiscount.com
- [ ] Test on live aliexpress.com
- [ ] Verify Amazon/eBay still work
- **Dependencies**: TASK-015
- **Verification**: All sites detect prices correctly
- **Time**: 1 hour

### TASK-017: Update existing test suite

- [ ] Update priceFinder tests with new behavior
- [ ] Ensure all existing tests pass
- [ ] Add new test cases for enhanced features
- [ ] Achieve 85%+ overall coverage
- **Dependencies**: TASK-016
- **Verification**: Full test suite passes
- **Time**: 1 hour

## Phase 4: Documentation & Cleanup

### TASK-018: Document new pattern system

- [ ] Add JSDoc comments to all new modules
- [ ] Document pattern configuration schema
- [ ] Create pattern addition guide
- [ ] Update README if needed
- **Dependencies**: TASK-017
- **Verification**: Documentation complete and clear
- **Time**: 30 minutes

### TASK-019: Code review preparation

- [ ] Run linting and fix any issues
- [ ] Run format check and fix
- [ ] Ensure all tests pass
- [ ] Create PR with detailed description
- **Dependencies**: TASK-018
- **Verification**: PR ready for review
- **Time**: 30 minutes

## Summary

- **Total Tasks**: 19
- **Estimated Time**: ~25 hours (increased due to DOM complexity)
- **Critical Path**: TASK-001 → TASK-002 → TASK-003 → TASK-004 (DOM) → TASK-008 → TASK-009 → TASK-010 → TASK-013

## Key Changes from Original Plan

1. **DOM-First Approach**: Analyze element structure before text patterns
2. **Real Examples**: Using examples.md instead of synthetic test pages
3. **Site Handlers**: Active extraction logic, not just configuration
4. **Multi-Strategy**: 5-pass detection including attributes and context
5. **Complex Formats**: Handle split prices, nested elements, aria-labels

## Notes

- DOM analysis is now the PRIMARY strategy, not a fallback
- Pattern matching becomes a supplementary approach
- Site-specific handlers are essential for major e-commerce sites
- Must handle prices split across multiple elements
- Performance impact expected but necessary for accuracy
