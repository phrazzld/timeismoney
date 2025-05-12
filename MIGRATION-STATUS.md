# Jest to Vitest Migration Status

## Summary

- Total test files: 104
- Fully migrated: 2 (1.92%)
- Partially migrated: 88 (84.62%)
- Not migrated: 13 (12.50%)
- Unknown status: 1

## Migration Progress

[------------------------------------------ ] 1.92%

## Fully Migrated Files

- src/**tests**/content/priceFinder.advanced.vitest.test.js
- src/**tests**/integration/content/domScanner.integration.vitest.test.js

## Partially Migrated Files

These files contain both Jest and Vitest patterns and should be cleaned up:

- src/**tests**/content/amazonHandler.vitest.test.js
- src/**tests**/content/dom-conversion.vitest.test.js
- src/**tests**/content/domModifier.vitest.test.js
- src/**tests**/content/domScanner.vitest.test.js
- src/**tests**/content/observer-callback.vitest.test.js
- src/**tests**/content/observer-stress.vitest.test.js
- src/**tests**/content/performance.vitest.test.js
- src/**tests**/content/price-conversion-flow.vitest.test.js
- src/**tests**/content/priceFinder.additional-currencies.vitest.test.js
- src/**tests**/content/priceFinder.basic-patterns.vitest.test.js
- src/**tests**/content/priceFinder.currency.part1.vitest.test.js
- src/**tests**/content/priceFinder.currency.part3.vitest.test.js
- src/**tests**/content/priceFinder.currency.vitest.test.js
- src/**tests**/content/priceFinder.findPrices.vitest.test.js
- src/**tests**/content/priceFinder.pattern.part1.vitest.test.js
- src/**tests**/content/priceFinder.pattern.part2.vitest.test.js
- src/**tests**/content/priceFinder.vitest.test.js
- src/**tests**/content/settingsManager.error.vitest.test.js
- src/**tests**/dom/content/domModifier.dom.vitest.test.js
- src/**tests**/dom/content/domModifier.vitest.test.js
- src/**tests**/dom/content/observer-callback.dom.vitest.test.js
- src/**tests**/dom/content/observer-callback.refactored.dom.vitest.test.js
- src/**tests**/dom/content/observer-callback.vitest.test.js
- src/**tests**/dom/content/observer-stress.dom.vitest.test.js
- src/**tests**/dom/content/observer-stress.vitest.test.js
- src/**tests**/dom/content/performance.dom.vitest.test.js
- src/**tests**/dom/content/performance.vitest.test.js
- src/**tests**/integration/content/amazonHandler.integration.vitest.test.js
- src/**tests**/integration/content/amazonHandler.vitest.test.js
- src/**tests**/integration/content/dom-conversion.integration.vitest.test.js
- src/**tests**/integration/content/dom-conversion.vitest.test.js
- src/**tests**/integration/content/domScanner.vitest.test.js
- src/**tests**/integration/content/price-conversion-flow.integration.vitest.test.js
- src/**tests**/integration/content/price-conversion-flow.vitest.test.js
- src/**tests**/integration/content/settingsManager.error.integration.vitest.test.js
- src/**tests**/integration/content/settingsManager.error.vitest.test.js
- src/**tests**/integration/options/formHandler.error.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.error.vitest.test.js
- src/**tests**/integration/options/formHandler.refactored.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.refactored.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.direct.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.direct.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.integration.test.js
- src/**tests**/integration/options/formHandler.storage.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.storage.vitest.test.js
- src/**tests**/integration/options/formHandler.xss.integration.test.js
- src/**tests**/integration/options/formHandler.xss.integration.vitest.test.js
- src/**tests**/integration/options/formHandler.xss.vitest.test.js
- src/**tests**/integration/popup/popup.error.integration.test.js
- src/**tests**/integration/popup/popup.error.integration.vitest.test.js
- src/**tests**/integration/popup/popup.error.vitest.test.js
- src/**tests**/options/formHandler.storage.direct.test.js
- src/**tests**/options/formHandler.storage.test.js
- src/**tests**/options/formHandler.test.js
- src/**tests**/unit/content/priceFinder.additional-currencies.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.advanced.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.basic-patterns.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.currency.part1.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.currency.part2.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.currency.part3.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.currency.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.edge-cases.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.enhanced.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.findPrices.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.pattern.part1.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.pattern.part2.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.simple.vitest.test.js
- src/**tests**/unit/content/priceFinder.unit.test.js
- src/**tests**/unit/content/priceFinder.unit.vitest.test.js
- src/**tests**/unit/content/priceFinder.vitest.test.js
- src/**tests**/unit/options/formHandler.unit.test.js
- src/**tests**/unit/options/formHandler.unit.vitest.test.js
- src/**tests**/unit/utils/converter.edge.unit.test.js
- src/**tests**/unit/utils/converter.edge.unit.vitest.test.js
- src/**tests**/unit/utils/converter.edge.vitest.test.js
- src/**tests**/unit/utils/converter.unified.unit.vitest.test.js
- src/**tests**/unit/utils/converter.unit.vitest.test.js
- src/**tests**/unit/utils/converter.vitest.test.js
- src/**tests**/unit/utils/parser.unit.vitest.test.js
- src/**tests**/unit/utils/parser.vitest.test.js
- src/**tests**/unit/utils/storage.error.unit.test.js
- src/**tests**/unit/utils/storage.error.unit.vitest.test.js
- src/**tests**/unit/utils/storage.error.vitest.test.js
- src/**tests**/unit/utils/storage.refactored.unit.vitest.test.js
- src/**tests**/unit/utils/storage.unit.test.js
- src/**tests**/unit/utils/storage.unit.vitest.test.js
- src/**tests**/unit/utils/storage.vitest.test.js
- src/**tests**/unit/utils/test-eslint-vitest-fixed.vitest.test.js

## Unmigrated Files

- src/**tests**/content/priceFinder.currency.part2.vitest.test.js
- src/**tests**/content/priceFinder.edge-cases.vitest.test.js
- src/**tests**/content/priceFinder.enhanced.vitest.test.js
- src/**tests**/options/formHandler.error.test.js
- src/**tests**/options/formHandler.xss.test.js
- src/**tests**/popup/popup.error.test.js
- src/**tests**/unit/utils/converter.edge.refactored.unit.vitest.test.js
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
