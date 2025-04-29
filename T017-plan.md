# T017 Plan: Update Jest and Babel configs for ES6 modules

## Current Status
- `package.json` now has `"type": "module"` added (T016 completed)
- Jest and Babel configs are already using ES module syntax (`export default`)
- Tests are failing - likely due to issues with imports/exports or incompatible configurations
- Need to ensure all configs properly handle ES modules

## Actions

1. Update Jest config
   - Ensure proper handling of ESM in Jest
   - Update transformIgnorePatterns if needed
   - Check node-modules handling

2. Update Babel config
   - Confirm proper preset configuration for ES modules
   - Check if additional plugins are needed

3. Update jest.setup.js
   - Convert to ES module syntax if needed

4. Test and validate
   - Run tests to confirm working configuration
   - Fix any remaining issues

## Implementation Details

### 1. Update Jest configuration
- Review and update moduleFileExtensions
- Add transformIgnorePatterns if needed
- Ensure extensionless imports are handled correctly
- Add appropriate resolver for ES modules

### 2. Update Babel configuration
- Confirm targets are appropriate for ES modules
- Add any necessary plugins for ES module support
- Ensure correct transformations are applied

### 3. Update jest.setup.js
- Convert to ES module format
- Ensure mocks are properly exported/imported

### 4. Test and Troubleshoot
- Run tests and fix any import/export issues
- Address any remaining test failures