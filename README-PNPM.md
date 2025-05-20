# Migration to pnpm Package Manager

## Summary

This project has been migrated from npm to [pnpm](https://pnpm.io/) for improved performance, disk efficiency, and dependency management. All contributors should use pnpm for installing dependencies and running scripts.

## Changes Made

1. Added pnpm configuration files:

   - `.npmrc` for pnpm settings
   - `pnpm-workspace.yaml` for workspace configuration
   - `.nvmrc` for Node.js version specification

2. Updated package.json:

   - Added engines field to specify node and pnpm versions
   - Set packageManager field to pnpm@8.12.0
   - Added preinstall script to prevent npm/yarn usage
   - Updated script references from npm to pnpm

3. Updated CI workflows:

   - Changed GitHub Actions to use pnpm instead of npm
   - Updated caching strategies to work with pnpm

4. Updated build scripts:

   - Modified build-extension.sh and load-extension.sh to use pnpm

5. Added documentation:
   - Created docs/development/PACKAGE_MANAGEMENT.md with detailed instructions

## Getting Started

If you haven't installed pnpm yet:

```bash
npm install -g pnpm
# or
brew install pnpm  # on macOS with Homebrew
```

After installing pnpm, run:

```bash
pnpm install
```

## Why pnpm?

- **Faster**: pnpm is significantly faster than npm and yarn
- **Disk space efficient**: Uses a content-addressable store to avoid duplication
- **Strict**: Prevents phantom dependencies by using symlinks
- **Workspace support**: Better monorepo support
- **Consistent**: Guarantees consistent installations across environments

## Additional Information

For more details on using pnpm in this project, see [docs/development/PACKAGE_MANAGEMENT.md](docs/development/PACKAGE_MANAGEMENT.md).
