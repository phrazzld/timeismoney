# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Quality Commands

- `pnpm install` - Install dependencies (required: Node 20+, pnpm 8+)
- `pnpm run lint` - Check code with ESLint (--max-warnings=0)
- `pnpm run lint:fix` - Fix ESLint issues automatically
- `pnpm run format` - Format code with Prettier
- `pnpm test` - Run all tests with Vitest
- `pnpm run test:unit` - Run only unit tests (src/**tests**/unit)
- `pnpm run test:integration` - Run only integration tests (src/**tests**/integration)
- `pnpm run test:dom` - Run only DOM tests (src/**tests**/dom)
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:coverage` - Generate test coverage report
- `pnpm run build` - Build Chrome extension bundles using esbuild
- `pnpm run start` - Load extension for development testing
- `pnpm run ci` - Run full CI pipeline (lint + test)

## Architecture Overview

**Chrome Extension**: Converts website prices to time equivalents based on user's hourly wage using Microsoft Recognizers and Money.js libraries.

**Core Components**:

- `content/`: Content scripts injected into web pages for price detection/conversion
- `background/`: Service worker for Chrome extension lifecycle management
- `popup/`: Extension popup UI for quick controls
- `options/`: Options page for user configuration
- `services/`: Recognition and currency services for price parsing
- `utils/`: Shared utilities (storage, conversion, logging, parsing)

**Content Script Flow**: Settings → DOM Scanning → Price Detection → Currency Conversion → DOM Modification

**Key Dependencies**:

- `@microsoft/recognizers-text-suite` for price pattern recognition
- `money` library for currency conversion and formatting
- `vitest` + `jsdom` for comprehensive testing

## Code Style & Patterns

- **ES6 Syntax**: Use `const`/`let`, arrow functions, template literals
- **Formatting**: 2-space indentation, 100 char line limit, single quotes, semicolons
- **JSDoc**: Required for all public APIs with parameter and return documentation
- **Error Handling**: Use `throw new Error()`, wrap critical code in try/catch
- **Naming**: Descriptive camelCase variables and functions
- **Organization**: Modules should have single responsibility
- **Modularization**: Follow structure in PLAN.md with domain separation
- **Types**: Use JSDoc type annotations consistently
- **Imports**: ES6 module syntax (`import`/`export`)
- **Storage**: Use shared storage utilities for Chrome storage interactions
- **Chrome API**: Mock chrome.\* APIs in tests using src/**tests**/mocks/chrome-api.mock.js

## Testing Strategy

- **Test Structure**: Organized by test type in src/**tests**/ directories
- **Unit Tests**: Pure logic tests with minimal mocking, run in Node environment
- **Integration Tests**: Component interaction tests, run in JSDOM environment
- **DOM Tests**: DOM manipulation tests, run in JSDOM environment
- **Mocking Policy**: Only mock true external dependencies (Chrome API), never internal modules
- **File Naming**: Test files use `.vitest.test.js` extension
- **Test Setup**: Global mocks configured in vitest.setup.js, test helpers in src/**tests**/setup/
- **Environment**: Automatic environment selection based on test directory (unit=node, others=jsdom)
- **Coverage**: Enforced minimums, exclude **tests** and dist directories

## Development Workflow

- **Package Manager**: Must use pnpm (enforced by preinstall script)
- **Node Version**: Requires Node 20+ (validated by scripts/validate-node-version.js)
- **Pre-commit**: Husky + lint-staged for automated formatting and linting
- **Security**: Automated dependency scanning with pnpm audit, security scripts in scripts/
- **Versioning**: Conventional Commits + standard-version for automated releases
- **CI/CD**: GitHub Actions with lint, test, security, and build validation
