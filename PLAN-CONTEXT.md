# PLAN-CONTEXT.md - Issue #75 Context

## Issue Details

**Title**: Redesign Work Hours Conversion UI to be a Clean Badge with a Clock Icon  
**Number**: #75  
**State**: OPEN  
**Labels**: priority:medium, type:feature, size:m, domain:content

## Feature Description

Redesign the price conversion display to use a modern badge design with clock icon for better visual distinction.

## Motivation

- Improve user experience with more visually appealing conversion display
- Make converted prices more distinct and recognizable
- Enhance the core value proposition through better UI
- Provide clear visual cue for work hours conversion

## Acceptance Criteria

- [ ] Custom-styled badge element for converted prices
- [ ] Clock icon incorporated into the design
- [ ] Clean, modern aesthetic that doesn't clash with website designs
- [ ] Responsive design that works across different screen sizes
- [ ] Accessible color scheme and contrast ratios
- [ ] Performance optimized (minimal CSS, no layout shifts)

## Technical Considerations

- Design badge component with CSS-in-JS or isolated CSS
- Source or create appropriate clock icon
- Ensure compatibility across different websites
- Test visual integration on various site designs

## Dependencies

- #68 (Modularize Price Finder Logic & Prioritize Pure Functions)

## Current Implementation Analysis

### Current Price Conversion Display

Based on the codebase analysis, the current price conversion mechanism:

1. **Location**: `src/content/domModifier.js` handles DOM modifications for price conversions
2. **CSS Class**: Uses `CONVERTED_PRICE_CLASS` constant from `src/utils/constants.js`
3. **Current Styling**: Basic styling applied via `src/content/index.js` injection
4. **Integration**: Works with Amazon, eBay, and general price detection handlers

### Key Files to Modify

- `src/content/domModifier.js` - Core price conversion display logic
- `src/utils/constants.js` - CSS class and styling constants
- `src/content/index.js` - CSS injection and initialization
- CSS styling system (currently injected directly)

### Current Architecture

- Price detection: `priceFinder.js` → Site handlers (`amazonHandler.js`, `ebayHandler.js`) → `domModifier.js`
- Settings: `settingsManager.js` provides user preferences
- DOM observation: `domScanner.js` monitors for new prices to convert

### Testing Infrastructure

- Unit tests in `src/__tests__/unit/`
- Integration tests in `src/__tests__/integration/`
- DOM tests in `src/__tests__/dom/`
- Mock system in `src/__tests__/mocks/`
