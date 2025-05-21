# Node.js Version Validation Script

This directory contains a script that validates GitHub Actions workflow files to ensure they use the centralized Node.js version management approach (`.nvmrc` file) instead of hardcoded Node.js versions.

## Purpose

The validation script:

- Scans all `.github/workflows/*.yml` files
- Detects `actions/setup-node` steps
- Verifies they use `node-version-file: '.nvmrc'` instead of hardcoded `node-version` values
- Exits with a non-zero code if any issues are found (for CI integration)

## Usage

```bash
# Run directly
node scripts/validate-node-version.js

# Or use the npm script
npm run validate:node-version
```

## Integration with CI

This script is integrated into the CI pipeline as the first step in both `ci.yml` and `ci-fix.yml` workflows. If any workflow file uses hardcoded Node.js versions, the CI build will fail with a clear error message.

## Testing

To verify that the validation script works correctly:

```bash
node scripts/test-validate-node-version.js
```

This test script creates temporary workflow files (compliant and non-compliant) and verifies that the validation logic correctly identifies issues.

## Adding New Workflows

When creating new GitHub Actions workflow files:

1. Always use the centralized Node.js version configuration:

   ```yaml
   - name: Set up Node.js
     uses: actions/setup-node@v3
     with:
       node-version-file: '.nvmrc'
   ```

2. Never hardcode Node.js versions:

   ```yaml
   # DON'T DO THIS
   - name: Set up Node.js
     uses: actions/setup-node@v3
     with:
       node-version: '20.x' # Hardcoded version
   ```

3. Run the validation script locally before pushing new workflow files to ensure compliance.
