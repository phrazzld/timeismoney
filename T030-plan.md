# T030 Plan: Separate Concerns of Scanning, Finding, Converting, Modifying

## Task Objective
Refine module boundaries to ensure each module has a clear, isolated responsibility. This follows the Single Responsibility Principle and will make the code more testable, maintainable, and flexible.

## Current State Analysis
The codebase has some separation of concerns already, but there are areas where responsibilities could be more clearly defined and interfaces between modules improved. We need to complete this separation to make the code more modular.

### Core Module Responsibilities
1. **domScanner.js** - Responsible for traversing DOM nodes
2. **priceFinder.js** - Responsible for identifying prices in text
3. **converter.js** - Responsible for performing price-to-time conversions
4. **domModifier.js** - Responsible for updating the DOM with conversion results
5. **index.js (content script)** - Coordinates the workflow and ties modules together

## Implementation Plan

### 1. Refine domScanner.js
- Ensure it only handles DOM traversal and node callbacks 
- Move any price-specific logic to priceFinder.js
- Remove any DOM modification from this module

### 2. Refine priceFinder.js 
- Focus on regex pattern matching and price extraction
- Ensure it doesn't perform conversions
- Ensure it doesn't modify the DOM
- Make it stateless where possible

### 3. Refine converter.js
- Focus solely on numerical conversions
- Ensure no DOM manipulation or price detection logic
- Only handle math/conversion operations

### 4. Refine domModifier.js
- Ensure it only handles DOM updates
- No price detection or conversion logic
- Focus on taking detected prices and conversion results and updating DOM

### 5. Update index.js (content script)
- Properly orchestrate the flow between the modules:
  1. Scan DOM with domScanner
  2. Find prices with priceFinder
  3. Convert prices with converter
  4. Update DOM with domModifier

## Testing Approach
- Ensure each module can be tested in isolation
- Modify or create tests that verify the separation of concerns

## Success Criteria
- Each module has clear, well-defined responsibilities 
- No leakage of responsibility between modules
- All tests pass with the updated structure