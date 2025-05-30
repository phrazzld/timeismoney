# Issue #104: Revised Approach - Universal Pattern Detection

## Original Issue

"Resolve critical site-specific failures (e.g., gearbest.com)"

## Initial Misinterpretation

We interpreted "site-specific failures" as requiring "site-specific handlers" - creating separate logic for each website.

## Critical Realization

The patterns that fail on specific sites are actually **universal e-commerce patterns** that should work everywhere:

### Universal Patterns Discovered

1. **Split Price Components**: "449€ 00" (found on Cdiscount, but could be anywhere)
2. **Nested Currency Elements**: `<span>US$</span><span>34.56</span>` (found on Gearbest, but common pattern)
3. **Contextual Prices**: "Under $20", "from $2.99" (found on Amazon, but universal)
4. **Symbol Variations**: "US$", "€ 14,32" with spaces (found on various sites, but universal)

## Revised Solution

### Before (Wrong Approach)

```javascript
if (domain === 'cdiscount.com') {
  handleCdiscountFormat(); // Only works on Cdiscount
}
```

### After (Correct Approach)

```javascript
// Try ALL patterns on ALL sites
extractSplitPrices(element); // Works everywhere
extractNestedCurrency(element); // Works everywhere
extractContextualPrices(element); // Works everywhere
```

## Key Architectural Change

**Currency Filtering**: Only convert prices in the user's selected currency

- User selects USD → Convert "$25" to time
- User selects USD → Leave "€25" untouched

## Benefits of Universal Approach

1. **Simplicity**: One extraction system, not N site handlers
2. **Coverage**: Automatically works on new sites
3. **Maintainability**: Less code, fewer edge cases
4. **Future-proof**: New patterns work everywhere once added

## Implementation Plan

1. Create universal price extractor combining all patterns
2. Add currency filtering layer
3. Remove site-specific logic
4. Update tests to verify universal operation

## Success Criteria

- All examples.md patterns work on ANY website
- Currency filtering prevents unwanted conversions
- Simpler codebase than site-specific approach
- Better performance (no domain checking)

This approach solves the root cause (missing patterns) rather than symptoms (site-specific failures).
