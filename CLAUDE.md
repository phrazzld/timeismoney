# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Quality Commands
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically 
- `npm run format` - Format code with Prettier
- Tests: Not implemented yet (future: `npm test`)

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