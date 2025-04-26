# TimeIsMoney Build Scripts

This directory contains scripts for building, testing, and loading the TimeIsMoney Chrome extension.

## Available Scripts

### build-extension.sh

Builds the extension by copying all necessary files into the `dist/` directory and creates a ZIP file for Chrome Web Store submission.

Usage:
```bash
npm run build
```

### load-extension.sh

Loads the extension into Chrome for local testing. This script will open Chrome with a new profile and load the extension from the `src/` directory.

Usage:
```bash
npm run start
```

### smoke-test.js

Performs a basic smoke test on the extension to verify that all required files exist and that the manifest is valid.

Usage:
```bash
npm run smoke-test
```

## Continuous Integration

These scripts are also used in the CI workflow to ensure that the extension can be built and passes basic tests before being merged.