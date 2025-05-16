# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Quality Commands

- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run all tests with Vitest
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests
- `npm run test:dom` - Run only DOM tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

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

## Testing Approach

- **Test Categories**: Tests are organized into unit, integration, and DOM tests
- **Unit Tests**: Pure logic tests with minimal mocking, run in Node environment
- **Integration Tests**: Tests for interactions between modules, run in JSDOM environment
- **DOM Tests**: Tests heavily reliant on DOM manipulation, run in JSDOM environment
- **Mocking**: Only mock true external dependencies (Chrome API), not internal modules
- **File Naming**: Test files use `.vitest.test.js` extension
- **Import Style**: Import Vitest functions explicitly (avoid globals when possible)
