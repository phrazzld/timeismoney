# Jest to Vitest Migration Status

## Summary

- Total test files: 104
- Fully migrated: 2 (1.92%)
- Partially migrated: 82 (78.85%)
- Not migrated: 19 (18.27%)
- Unknown status: 1

## Migration Progress

[---------------------------------------         ] 1.92%

## Fully Migrated Files

- src/__tests__/content/priceFinder.advanced.vitest.test.js
- src/__tests__/integration/content/domScanner.vitest.test.js

## Partially Migrated Files

These files contain both Jest and Vitest patterns and should be cleaned up:

- src/__tests__/content/amazonHandler.vitest.test.js
- src/__tests__/content/dom-conversion.vitest.test.js
- src/__tests__/content/domModifier.vitest.test.js
- src/__tests__/content/domScanner.vitest.test.js
- src/__tests__/content/observer-callback.vitest.test.js
- src/__tests__/content/observer-stress.vitest.test.js
- src/__tests__/content/performance.vitest.test.js
- src/__tests__/content/price-conversion-flow.vitest.test.js
- src/__tests__/content/priceFinder.additional-currencies.vitest.test.js
- src/__tests__/content/priceFinder.basic-patterns.vitest.test.js
- src/__tests__/content/priceFinder.currency.part1.vitest.test.js
- src/__tests__/content/priceFinder.currency.part3.vitest.test.js
- src/__tests__/content/priceFinder.currency.vitest.test.js
- src/__tests__/content/priceFinder.findPrices.vitest.test.js
- src/__tests__/content/priceFinder.pattern.part1.vitest.test.js
- src/__tests__/content/priceFinder.pattern.part2.vitest.test.js
- src/__tests__/content/priceFinder.vitest.test.js
- src/__tests__/content/settingsManager.error.vitest.test.js
- src/__tests__/dom/content/domModifier.dom.vitest.test.js
- src/__tests__/dom/content/domModifier.vitest.test.js
- src/__tests__/dom/content/observer-callback.dom.vitest.test.js
- src/__tests__/dom/content/observer-callback.refactored.dom.vitest.test.js
- src/__tests__/dom/content/observer-callback.vitest.test.js
- src/__tests__/dom/content/observer-stress.dom.vitest.test.js
- src/__tests__/dom/content/observer-stress.vitest.test.js
- src/__tests__/dom/content/performance.dom.vitest.test.js
- src/__tests__/dom/content/performance.vitest.test.js
- src/__tests__/integration/content/amazonHandler.vitest.test.js
- src/__tests__/integration/content/dom-conversion.vitest.test.js
- src/__tests__/integration/content/price-conversion-flow.vitest.test.js
- src/__tests__/integration/content/settingsManager.error.vitest.test.js
- src/__tests__/integration/options/formHandler.error.integration.test.js
- src/__tests__/integration/options/formHandler.error.vitest.test.js
- src/__tests__/integration/options/formHandler.refactored.integration.test.js
- src/__tests__/integration/options/formHandler.refactored.vitest.test.js
- src/__tests__/integration/options/formHandler.storage.direct.integration.test.js
- src/__tests__/integration/options/formHandler.storage.direct.vitest.test.js
- src/__tests__/integration/options/formHandler.storage.integration.test.js
- src/__tests__/integration/options/formHandler.storage.integration.vitest.test.js
- src/__tests__/integration/options/formHandler.storage.vitest.test.js
- src/__tests__/integration/options/formHandler.xss.integration.vitest.test.js
- src/__tests__/integration/options/formHandler.xss.vitest.test.js
- src/__tests__/integration/popup/popup.error.integration.vitest.test.js
- src/__tests__/integration/popup/popup.error.vitest.test.js
- src/__tests__/options/formHandler.error.test.js
- src/__tests__/options/formHandler.storage.direct.test.js
- src/__tests__/options/formHandler.storage.test.js
- src/__tests__/options/formHandler.test.js
- src/__tests__/unit/content/priceFinder.additional-currencies.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.advanced.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.basic-patterns.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.currency.part1.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.currency.part2.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.currency.part3.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.currency.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.edge-cases.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.enhanced.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.findPrices.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.pattern.part1.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.pattern.part2.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.simple.vitest.test.js
- src/__tests__/unit/content/priceFinder.unit.test.js
- src/__tests__/unit/content/priceFinder.unit.vitest.test.js
- src/__tests__/unit/content/priceFinder.vitest.test.js
- src/__tests__/unit/options/formHandler.unit.test.js
- src/__tests__/unit/options/formHandler.unit.vitest.test.js
- src/__tests__/unit/utils/converter.edge.unit.test.js
- src/__tests__/unit/utils/converter.edge.unit.vitest.test.js
- src/__tests__/unit/utils/converter.edge.vitest.test.js
- src/__tests__/unit/utils/converter.unified.unit.vitest.test.js
- src/__tests__/unit/utils/converter.unit.vitest.test.js
- src/__tests__/unit/utils/converter.vitest.test.js
- src/__tests__/unit/utils/parser.unit.vitest.test.js
- src/__tests__/unit/utils/parser.vitest.test.js
- src/__tests__/unit/utils/storage.error.unit.test.js
- src/__tests__/unit/utils/storage.error.unit.vitest.test.js
- src/__tests__/unit/utils/storage.error.vitest.test.js
- src/__tests__/unit/utils/storage.refactored.unit.vitest.test.js
- src/__tests__/unit/utils/storage.unit.test.js
- src/__tests__/unit/utils/storage.unit.vitest.test.js
- src/__tests__/unit/utils/storage.vitest.test.js
- src/__tests__/unit/utils/test-eslint-vitest-fixed.vitest.test.js

## Unmigrated Files

- src/__tests__/content/priceFinder.currency.part2.vitest.test.js
- src/__tests__/content/priceFinder.edge-cases.vitest.test.js
- src/__tests__/content/priceFinder.enhanced.vitest.test.js
- src/__tests__/integration/content/amazonHandler.integration.test.js
- src/__tests__/integration/content/dom-conversion.integration.test.js
- src/__tests__/integration/content/domScanner.integration.test.js
- src/__tests__/integration/content/price-conversion-flow.integration.test.js
- src/__tests__/integration/content/settingsManager.error.integration.test.js
- src/__tests__/integration/options/formHandler.xss.integration.test.js
- src/__tests__/integration/popup/popup.error.integration.test.js
- src/__tests__/options/formHandler.xss.test.js
- src/__tests__/popup/popup.error.test.js
- src/__tests__/unit/utils/converter.edge.refactored.unit.vitest.test.js
- src/__tests__/utils/converter.edge.test.js
- src/__tests__/utils/converter.test.js
- src/__tests__/utils/converter.unified.test.js
- src/__tests__/utils/parser.test.js
- src/__tests__/utils/storage.error.test.js
- src/__tests__/utils/storage.test.js

## Next Steps

1. Use the `jest-to-vitest-codemod.js` script to automatically convert the unmigrated files:
   ```
   node scripts/jest-to-vitest-codemod.js --backup <file_path>
   ```

2. Clean up any partially migrated files by ensuring they only use Vitest patterns

3. Run the migration status script again to verify progress:
   ```
   node scripts/migration-status.js
   ```
