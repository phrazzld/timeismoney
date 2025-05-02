# BACKLOG

## UI & Build Tasks

- Omit glance.md files, backlog.md, etc from dist/ build
- Create nicer popup / ui elements / design
- Set up useful precommit hooks
  - Warn when files are over 500 lines
  - Error when files are over 1000 lines
  - Run tests
  - Run linter

## Test Suite Optimization

### High Priority

- Change default Jest environment to "node" in jest.config.cjs
- Add per-file JSDOM opt-in with `/** @jest-environment jsdom */` annotation to DOM-dependent tests
- Fix window.location issues by using `Object.defineProperty` in jest.setup.cjs:
  ```javascript
  Object.defineProperty(window, 'location', {
    writable: true,
    value: new URL('http://localhost'),
  });
  ```
- Run `npx jest --logHeapUsage` to identify memory-intensive tests and refactor or split them

### Code Architecture

- Separate pure logic from DOM-dependent code:
  - Move pure string/number handling to dedicated modules
  - Create thin wrappers around DOM manipulation code
- Replace regex-heavy tests with more focused unit tests
- Use simple test fixtures instead of complex DOM structures

### Build & Performance

- Consider replacing Babel transform with SWC or esbuild for faster compile times and lower memory usage:
  ```javascript
  transform: {
    '^.+\\.(js|jsx)$': ['@swc/jest']
  }
  ```
- Investigate migrating unit tests to Vitest for smaller memory footprint

### CI Pipeline

- Add test categorization to run critical tests first, memory-intensive tests last
- Consider implementing E2E tests with Playwright for browser integration tests
