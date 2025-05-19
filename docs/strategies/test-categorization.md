# Test Categorization Analysis

This document categorizes all test files in the codebase as part of the migration from Jest to Vitest.

## Unit Tests

Tests that focus on pure logic, with no DOM dependencies. These will run in Node environment.

1. `src/__tests__/utils/converter.test.js` → `unit/utils/converter.unit.test.js`
2. `src/__tests__/utils/converter.edge.test.js` → `unit/utils/converter.edge.unit.test.js`
3. `src/__tests__/utils/converter.unified.test.js` → `unit/utils/converter.unified.unit.test.js`
4. `src/__tests__/utils/parser.test.js` → `unit/utils/parser.unit.test.js`
5. `src/__tests__/utils/storage.test.js` → `unit/utils/storage.unit.test.js`
6. `src/__tests__/utils/storage.error.test.js` → `unit/utils/storage.error.unit.test.js`
7. `src/__tests__/content/priceFinder.test.js` → `unit/content/priceFinder.unit.test.js`
8. `src/__tests__/content/priceFinder.currency.test.js` → `unit/content/priceFinder.currency.unit.test.js`
9. `src/__tests__/content/priceFinder.currency.part1.test.js` → `unit/content/priceFinder.currency.part1.unit.test.js`
10. `src/__tests__/content/priceFinder.currency.part2.test.js` → `unit/content/priceFinder.currency.part2.unit.test.js`
11. `src/__tests__/content/priceFinder.currency.part3.test.js` → `unit/content/priceFinder.currency.part3.unit.test.js`
12. `src/__tests__/content/priceFinder.basic-patterns.test.js` → `unit/content/priceFinder.basic-patterns.unit.test.js`
13. `src/__tests__/content/priceFinder.pattern.part1.test.js` → `unit/content/priceFinder.pattern.part1.unit.test.js`
14. `src/__tests__/content/priceFinder.pattern.part2.test.js` → `unit/content/priceFinder.pattern.part2.unit.test.js`
15. `src/__tests__/content/priceFinder.advanced.test.js` → `unit/content/priceFinder.advanced.unit.test.js`
16. `src/__tests__/content/priceFinder.enhanced.test.js` → `unit/content/priceFinder.enhanced.unit.test.js`
17. `src/__tests__/content/priceFinder.additional-currencies.test.js` → `unit/content/priceFinder.additional-currencies.unit.test.js`
18. `src/__tests__/content/priceFinder.edge-cases.test.js` → `unit/content/priceFinder.edge-cases.unit.test.js`
19. `src/__tests__/content/priceFinder.findPrices.test.js` → `unit/content/priceFinder.findPrices.unit.test.js`
20. `src/__tests__/content/priceFinder.test.patch.js` → `unit/content/priceFinder.test.patch.unit.test.js` (Marked for removal once Vitest is implemented)
21. `src/__tests__/options/formHandler.test.js` → `unit/options/formHandler.unit.test.js`

## Integration Tests

Tests involving interactions between modules, potentially light DOM usage. These will run in JSDOM environment.

1. `src/__tests__/content/dom-conversion.test.js` → `integration/content/dom-conversion.integration.test.js`
2. `src/__tests__/content/price-conversion-flow.test.js` → `integration/content/price-conversion-flow.integration.test.js`
3. `src/__tests__/content/settingsManager.error.test.js` → `integration/content/settingsManager.error.integration.test.js`
4. `src/__tests__/content/amazonHandler.test.js` → `integration/content/amazonHandler.integration.test.js`
5. `src/__tests__/content/domScanner.test.js` → `integration/content/domScanner.integration.test.js`
6. `src/__tests__/options/formHandler.storage.test.js` → `integration/options/formHandler.storage.integration.test.js`
7. `src/__tests__/options/formHandler.storage.direct.test.js` → `integration/options/formHandler.storage.direct.integration.test.js`
8. `src/__tests__/options/formHandler.error.test.js` → `integration/options/formHandler.error.integration.test.js`
9. `src/__tests__/options/formHandler.xss.test.js` → `integration/options/formHandler.xss.integration.test.js`
10. `src/__tests__/popup/popup.error.test.js` → `integration/popup/popup.error.integration.test.js`

## DOM Tests

Tests heavily reliant on DOM manipulation, MutationObservers, complex browser APIs. These will run in JSDOM environment.

1. `src/__tests__/content/domModifier.test.js` → `dom/content/domModifier.dom.test.js`
2. `src/__tests__/content/observer-callback.test.js` → `dom/content/observer-callback.dom.test.js`
3. `src/__tests__/content/observer-stress.test.js` → `dom/content/observer-stress.dom.test.js`
4. `src/__tests__/content/performance.test.js` → `dom/content/performance.dom.test.js`

## Setup Files

Test setup files that should be moved to the setup directory.

1. `src/__tests__/setup.test.js` → `setup/setup.js`
2. `src/__tests__/test-setup-example.js` → `setup/test-setup-example.js`
3. `src/__tests__/utils/test-helpers.js` → `setup/test-helpers.js`

## Refactoring Notes

1. `performance.test.js` - Mixes performance benchmarking with DOM testing. Consider separating performance calculations from DOM testing.

2. `observer-stress.test.js` - Uses mock MutationObserver implementation that needs careful migration. Contains performance testing that should be separated.

3. `priceFinder.test.patch.js` - This test file appears to be a workaround for Jest performance issues. Should be removed once migration to Vitest is complete.

4. `domModifier.test.js` - Contains integration aspects in the `processTextNode` test. Consider refactoring for cleaner separation.

5. Mock reuse - Several test files implement similar mocks (e.g., MutationObserver). These should be centralized in the mocks directory.
