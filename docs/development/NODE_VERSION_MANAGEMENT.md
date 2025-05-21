# Node.js Version Management

This document explains how Node.js version management is centralized in this project.

## Overview

To ensure consistency between local development and CI environments, we use a centralized approach to Node.js version management using the `.nvmrc` file.

## How It Works

1. The root `.nvmrc` file contains the Node.js version used by:
   - Local development (via tools like nvm)
   - CI workflows (via GitHub Actions)

2. CI workflows reference this file using the `node-version-file` parameter:
   ```yaml
   - name: Set up Node.js
     uses: actions/setup-node@v3
     with:
       node-version-file: '.nvmrc'
   ```

3. Package.json enforces this version using the `engines` field:
   ```json
   "engines": {
     "node": ">=20.0.0",
     "pnpm": ">=8.0.0"
   }
   ```

## Updating the Node.js Version

When you need to update the Node.js version:

1. Update the `.nvmrc` file with the new version number
2. Update the `engines.node` field in package.json
3. Commit both changes together

The CI workflows will automatically use the updated version on the next run.

## Validating Version Consistency

To ensure version consistency, the following elements should always be in sync:
- The version in `.nvmrc`
- The version requirement in `package.json` (engines.node)
- All CI workflow files using `node-version-file: '.nvmrc'`

## Benefits

This approach:
- Provides a single source of truth for Node.js versions
- Reduces the risk of version mismatch issues
- Simplifies version updates (change one file instead of multiple workflow files)
- Aligns local development with CI environments