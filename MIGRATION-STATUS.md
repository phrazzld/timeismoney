# Jest to Vitest Migration Status

## Summary

- Total test files: 104
- Fully migrated: 1 (0.96%)
- Partially migrated: 71 (68.27%)
- Not migrated: 30 (28.85%)
- Unknown status: 2

## Migration Progress

[---------------------------------- ] 0.96%

## Fully Migrated Files

- src/**tests**/integration/content/domScanner.vitest.test.js

## Partially Migrated Files

These files contain both Jest and Vitest patterns and should be cleaned up:

- src/**tests**/content/amazonHandler.vitest.test.js
- src/**tests**/content/dom-conversion.vitest.test.js
- src/**tests**/content/domModifier.vitest.test.js
- src/**tests**/content/domScanner.vitest.test.js
- src/**tests**/content/observer-callback.test.js
- src/**tests**/content/observer-stress.vitest.test.js
- src/**tests**/content/performance.vitest.test.js
- src/**tests**/content/priceFinder.additional-currencies.test.js
- src/**tests**/content/priceFinder.basic-patterns.test.js
- src/**tests**/content/priceFinder.currency.part1.test.js
- src/**tests**/content/priceFinder.currency.part3.test.js
- src/**tests**/content/priceFinder.currency.test.js
- src/**tests**/content/priceFinder.findPrices.test.js
- src/**tests**/content/priceFinder.pattern.part1.test.js
- src/**tests**/content/priceFinder.pattern.part2.test.js
- src/**tests**/content/priceFinder.test.js
- src/**tests**/dom/content/domModifier.vitest.test.js
- src/**tests**/dom/content/observer-callback.dom.test.js
- src/**tests**/dom/content/observer-callback.refactored.dom.test.js
- src/**tests**/dom/content/observer-callback.vitest.test.js
- src/**tests**/dom/content/observer-stress.vitest.test.js
- src/**tests**/dom/content/performance.vitest.test.js
- src/**tests**/integration/content/amazonHandler.vitest.test.js
- src/**tests**/integration/content/dom-conversion.vitest.test.js
- src/**tests**/integration/content/price-conversion-flow.vitest.test.js
- src/**tests**/integration/content/settingsManager.error.vitest.test.js
- src/**tests**/integration/options/formHandler.error.integration.test.js
- src/**tests**/integration/options/formHandler.error.vitest.test.js
- src/**tests**/integration/options/formHandler.refactored.integration.test.js
- src/**tests**/integration/options/formHandler.refactored.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.direct.integration.test.js
- src/**tests**/integration/options/formHandler.storage.direct.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.integration.test.js
- src/**tests**/integration/options/formHandler.storage.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.vitest.test.js
- src/**tests**/integration/options/formHandler.xss.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.xss.vitest.test.js
- src/**tests**/integration/popup/popup.error.integration.vitest.test.js
- src/**tests**/integration/popup/popup.error.vitest.test.js
- src/**tests**/options/formHandler.error.test.js
- src/**tests**/options/formHandler.storage.direct.test.js
- src/**tests**/options/formHandler.storage.test.js
- src/**tests**/options/formHandler.test.js
- src/**tests**/unit/content/priceFinder.additional-currencies.unit.test.js
- src/**tests**/unit/content/priceFinder.advanced.unit.test.js
- src/**tests**/unit/content/priceFinder.basic-patterns.unit.test.js
- src/**tests**/unit/content/priceFinder.currency.part1.unit.test.js
- src/**tests**/unit/content/priceFinder.currency.part2.unit.test.js
- src/**tests**/unit/content/priceFinder.currency.part3.unit.test.js
- src/**tests**/unit/content/priceFinder.currency.unit.test.js
- src/**tests**/unit/content/priceFinder.edge-cases.unit.test.js
- src/**tests**/unit/content/priceFinder.enhanced.unit.test.js
- src/**tests**/unit/content/priceFinder.findPrices.unit.test.js
- src/**tests**/unit/content/priceFinder.pattern.part1.unit.test.js
- src/**tests**/unit/content/priceFinder.pattern.part2.unit.test.js
- src/**tests**/unit/content/priceFinder.simple.vitest.test.js
- src/**tests**/unit/content/priceFinder.unit.test.js
- src/**tests**/unit/content/priceFinder.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.vitest.test.js
- src/**tests**/unit/options/formHandler.unit.test.js
- src/**tests**/unit/options/formHandler.unit.vitest.test.js
- src/**tests**/unit/utils/converter.edge.unit.vitest.test.js
- src/**tests**/unit/utils/converter.edge.vitest.test.js
- src/**tests**/unit/utils/converter.vitest.test.js
- src/**tests**/unit/utils/parser.vitest.test.js
- src/**tests**/unit/utils/storage.error.unit.vitest.test.js
- src/**tests**/unit/utils/storage.error.vitest.test.js
- src/**tests**/unit/utils/storage.refactored.unit.test.js
- src/**tests**/unit/utils/storage.unit.vitest.test.js
- src/**tests**/unit/utils/storage.vitest.test.js
- src/**tests**/unit/utils/test-eslint-vitest-fixed.vitest.test.js

## Unmigrated Files

- src/**tests**/content/price-conversion-flow.test.js
- src/**tests**/content/priceFinder.currency.part2.test.js
- src/**tests**/content/priceFinder.edge-cases.test.js
- src/**tests**/content/priceFinder.enhanced.test.js
- src/**tests**/content/settingsManager.error.test.js
- src/**tests**/dom/content/domModifier.dom.test.js
- src/**tests**/dom/content/observer-stress.dom.test.js
- src/**tests**/dom/content/performance.dom.test.js
- src/**tests**/integration/content/amazonHandler.integration.test.js
- src/**tests**/integration/content/dom-conversion.integration.test.js
- src/**tests**/integration/content/domScanner.integration.test.js
- src/**tests**/integration/content/price-conversion-flow.integration.test.js
- src/**tests**/integration/content/settingsManager.error.integration.test.js
- src/**tests**/integration/options/formHandler.xss.integration.test.js
- src/**tests**/integration/popup/popup.error.integration.test.js
- src/**tests**/options/formHandler.xss.test.js
- src/**tests**/popup/popup.error.test.js
- src/**tests**/unit/utils/converter.edge.refactored.unit.test.js
- src/**tests**/unit/utils/converter.edge.unit.test.js
- src/**tests**/unit/utils/converter.unified.unit.test.js
- src/**tests**/unit/utils/converter.unit.test.js
- src/**tests**/unit/utils/parser.unit.test.js
- src/**tests**/unit/utils/storage.error.unit.test.js
- src/**tests**/unit/utils/storage.unit.test.js
- src/**tests**/utils/converter.edge.test.js
- src/**tests**/utils/converter.test.js
- src/**tests**/utils/converter.unified.test.js
- src/**tests**/utils/parser.test.js
- src/**tests**/utils/storage.error.test.js
- src/**tests**/utils/storage.test.js

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
