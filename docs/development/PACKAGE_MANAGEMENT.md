# Package Management

This project uses [pnpm](https://pnpm.io/) as its package manager. Please do not use npm or yarn to manage dependencies in this project.

## Why pnpm?

- **Disk space efficiency**: pnpm uses a content-addressable store to avoid duplication of packages across projects
- **Strict dependency management**: Prevents phantom dependencies (packages not explicitly listed in dependencies)
- **Fast installation**: pnpm is significantly faster than npm and yarn
- **Workspace support**: Better monorepo support with workspace features
- **Consistent dependency resolution**: Guarantees consistent installations across environments

## Getting Started

### Installation

If you don't have pnpm installed:

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Basic Commands

```bash
# Install dependencies
pnpm install

# Add a dependency
pnpm add [package-name]

# Add a dev dependency
pnpm add -D [package-name]

# Run scripts
pnpm [script-name]  # e.g., pnpm test
```

## Enforcement

This project enforces the use of pnpm through several mechanisms:

1. A preinstall script that prevents npm and yarn usage
2. Engine restrictions in package.json
3. .npmrc configuration for consistent behavior
4. Workspace configuration via pnpm-workspace.yaml

These mechanisms help ensure consistent package management across the development team.

## Troubleshooting

If you encounter issues with pnpm:

1. Make sure you're using a compatible Node.js version (see .nvmrc)
2. Try clearing the pnpm store: `pnpm store prune`
3. Delete node_modules and pnpm-lock.yaml, then reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`