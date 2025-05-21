# CI Workflow Validation

This document describes the validation mechanism used to ensure consistent Node.js version management in CI workflows.

## Node.js Version Validation

To prevent version mismatch issues, we have implemented an automated validation script that checks all GitHub Actions workflow files for proper Node.js version configuration.

### Validation Rules

The validation script enforces these rules:

1. All `actions/setup-node` steps must use `node-version-file: '.nvmrc'` instead of hardcoded `node-version` values
2. The `.nvmrc` file in the project root is the single source of truth for Node.js version
3. No other version specification methods are allowed in CI workflows

### Running the Validation

The validation script can be run locally to check for compliance:

```bash
# Using npm script
npm run validate:node-version

# Or directly
node scripts/validate-node-version.js
```

### Integration with CI

The validation script is integrated as a first step in the CI pipeline. If any workflow file is non-compliant, the CI build will fail early with a clear error message.

## Why This Matters

Using centralized Node.js version management:

1. **Prevents version mismatch issues** between what's required in package.json and what's used in CI
2. **Simplifies updates** by changing a single `.nvmrc` file instead of multiple workflow files
3. **Ensures consistency** between local development and CI environments
4. **Standardizes workflow files** to follow the same pattern

## Troubleshooting

If the validation fails:

1. Check the error message to identify which workflow file is non-compliant
2. Update any `node-version: X.Y.Z` entries to use `node-version-file: '.nvmrc'` instead
3. Run the validation script again to confirm the fix