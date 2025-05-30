# REVISED TODO: Universal Price Detection System

## Critical Realization

Site-specific handlers are the WRONG approach. The patterns we discovered (split prices, nested currency, contextual phrases) are **universal e-commerce patterns** that should work everywhere.

## Completed Work (Keep These!)

### ✅ TASK-004: DOM Price Analyzer

- Already universal! Works on any DOM structure
- Extracts from attributes, split elements, nested structures
- No refactoring needed

### ✅ TASK-005: Enhanced Pattern Library

- Already universal! Patterns work on any text
- Space variations, split components, contextual phrases
- No refactoring needed

### ⚠️ TASK-006: Site Handlers (Needs Refactor)

- Built with wrong approach (domain-restricted)
- Contains good pattern logic that should be universal
- Need to extract patterns and remove domain checks

## New Universal Approach Tasks

### TASK-007: Create Universal Price Extractor

- [ ] Create `src/content/universalPriceExtractor.js`
- [ ] Combine ALL extraction strategies (DOM + patterns)
- [ ] No domain checks - patterns work everywhere
- [ ] Single unified extraction interface
- **Dependencies**: TASK-004, TASK-005
- **Time**: 1 hour

### TASK-008: Implement Currency Filtering

- [ ] Add currency detection logic
- [ ] Filter to only process user's selected currency
- [ ] Leave other currencies untouched
- [ ] Add comprehensive tests
- **Dependencies**: TASK-007
- **Time**: 30 minutes

### TASK-009: Refactor DOM Scanner

- [ ] Remove site-specific handler imports
- [ ] Use universal extractor instead
- [ ] Simplify the walk logic
- [ ] Update all integration points
- **Dependencies**: TASK-007, TASK-008
- **Time**: 30 minutes

### TASK-010: Universal Testing Suite

- [ ] Test all patterns work on generic HTML
- [ ] Remove site-specific test constraints
- [ ] Add currency filtering tests
- [ ] Verify examples.md patterns universally
- **Dependencies**: TASK-009
- **Time**: 1 hour

### TASK-011: Cleanup and Documentation

- [ ] Remove site-specific handler code
- [ ] Update architecture documentation
- [ ] Clean up unused imports/files
- [ ] Update README with new approach
- **Dependencies**: TASK-010
- **Time**: 30 minutes

## Deferred/Removed Tasks

### ❌ Site-Specific Configurations

- Not needed with universal approach

### ❌ Per-Site Test Pages

- Patterns should work on ANY HTML

### ❌ Site Handler Framework

- Overly complex for no benefit

## Future Enhancements (Post-MVP)

### Multi-Currency Support

- [ ] Allow conversion between currencies
- [ ] Real-time exchange rates
- [ ] User can see prices in preferred currency

### Pattern Learning

- [ ] Detect new patterns automatically
- [ ] Machine learning for price detection
- [ ] Crowdsourced pattern updates

### Performance Optimization

- [ ] Lazy pattern compilation
- [ ] Caching extracted prices
- [ ] Incremental DOM updates

## Architecture Principles

1. **Universal First**: Every pattern works everywhere
2. **Currency Aware**: Only convert user's selected currency
3. **Simple Pipeline**: DOM → Extract → Filter → Convert
4. **No Special Cases**: Avoid site-specific logic

## Success Metrics

1. All examples.md prices detected universally
2. Currency filtering working correctly
3. Simplified codebase (less code than before)
4. Better test coverage
5. Faster execution (fewer checks)

## Implementation Order

1. TASK-007: Universal extractor (foundation)
2. TASK-008: Currency filtering (critical feature)
3. TASK-009: DOM scanner refactor (integration)
4. TASK-010: Testing (validation)
5. TASK-011: Cleanup (polish)

This approach is simpler, more maintainable, and more powerful than site-specific handlers.
