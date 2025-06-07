# Badge UI Redesign Engineering Plan

**Philosophy: Ship fast, iterate, refactor elegant**

## SPRINT 0 (24 hours) - PROOF OF CONCEPT 🚀

_Goal: Get a badge rendering SOMEWHERE to build confidence_

- [x] **S0.1 - Quick Win: Hardcoded badge in DOM** ⚡

  - Action: Add a hardcoded badge element directly in `domModifier.js` - just HTML + inline styles
  - Success: Can see a badge render on ANY website when price detected
  - Time: 2 hours
  - No dependencies, no design tokens, just SHIP SOMETHING

- [x] **S0.2 - Basic clock icon** ⚡

  - Action: Find any clock SVG, embed as data URI, slap it in the badge
  - Success: Badge has a clock icon (ugly is fine)
  - Time: 1 hour

- [ ] **S0.3 - Manual test on Amazon** ⚡
  - Action: Load extension, visit Amazon, see if badges appear
  - Success: Can screenshot working badge on real site
  - Time: 30 minutes

## SPRINT 1 (2-3 days) - FUNCTIONAL MVP 🎯

_Goal: End-to-end working system, ugly but functional_

- [ ] **S1.1 - Extract badge creation function**

  - Action: Move hardcoded badge logic into `createBadge(originalPrice, convertedHours)` function
  - Success: Clean separation, easier to iterate
  - Time: 1 hour

- [ ] **S1.2 - Basic CSS-in-JS styling**

  - Action: Generate inline styles programmatically, basic color/spacing constants
  - Success: Badge looks intentional, not broken
  - Time: 3 hours

- [ ] **S1.3 - Integrate with price detection flow**

  - Action: Replace text modification in `domModifier.js` with badge creation
  - Success: All detected prices become badges automatically
  - Time: 4 hours

- [ ] **S1.4 - Cleanup on removal**

  - Action: Track badge elements, remove when original price removed
  - Success: No orphaned badges, no memory leaks
  - Time: 2 hours

- [ ] **S1.5 - Test on 3 major sites**
  - Action: Manual test on Amazon, eBay, general e-commerce
  - Success: Screenshots of working badges, note any major issues
  - Time: 1 hour

## SPRINT 2 (2-3 days) - POLISH & EDGE CASES ✨

_Goal: Looks professional, handles edge cases gracefully_

- [ ] **S2.1 - Proper badge component class**

  - Action: Refactor into `PriceBadge` class with constructor/render/destroy
  - Success: Clean OOP design, easier to extend
  - Time: 3 hours

- [ ] **S2.2 - Dynamic theme adaptation**

  - Action: Detect background color, adjust badge colors for contrast
  - Success: Badge readable on light/dark backgrounds
  - Time: 4 hours

- [ ] **S2.3 - Responsive design**

  - Action: Badge scales properly on mobile, different viewport sizes
  - Success: Looks good on phone/desktop
  - Time: 2 hours

- [ ] **S2.4 - Nice clock icon**

  - Action: Create/find proper optimized SVG, color inheritance
  - Success: Professional-looking icon, scales well
  - Time: 2 hours

- [ ] **S2.5 - Style conflict prevention**
  - Action: Use unique class names, CSS specificity, maybe Shadow DOM attempt
  - Success: Badge unaffected by host site styles
  - Time: 3 hours

## SPRINT 3 (2-3 days) - PRODUCTION READY 🚢

_Goal: Ship-quality code with tests and performance_

- [ ] **S3.1 - Basic accessibility**

  - Action: Add ARIA labels, screen reader friendly text
  - Success: Passes basic accessibility audit
  - Time: 2 hours

- [ ] **S3.2 - Performance optimization**

  - Action: Style caching, avoid DOM thrashing, measure performance
  - Success: No noticeable performance impact
  - Time: 3 hours

- [ ] **S3.3 - Unit tests**

  - Action: Test badge component creation, styling, cleanup
  - Success: Core functionality covered by tests
  - Time: 4 hours

- [ ] **S3.4 - Integration tests**

  - Action: Test end-to-end price detection → badge creation flow
  - Success: Regression protection for core user journey
  - Time: 3 hours

- [ ] **S3.5 - Cross-site validation**

  - Action: Test on 10+ e-commerce sites, document any issues
  - Success: Works reliably across different sites
  - Time: 2 hours

- [ ] **S3.6 - Feature flag**
  - Action: Add setting to toggle old vs new badge display
  - Success: Easy rollback if needed
  - Time: 2 hours

## BACKLOG (Future iterations) 📋

_Nice-to-haves that don't block shipping_

- [ ] **Visual regression testing infrastructure**
- [ ] **Shadow DOM for perfect style isolation**
- [ ] **Advanced theme detection (image backgrounds)**
- [ ] **Animation/micro-interactions**
- [ ] **A/B testing analytics**
- [ ] **Custom badge styling options**

## ENGINEERING PRINCIPLES 🎯

### Sprint 0: Prove it works

- Hardcode everything
- Copy-paste is fine
- Ugly code is acceptable
- Just get pixels on screen

### Sprint 1: Make it functional

- Extract reusable functions
- Basic error handling
- Works end-to-end
- Still messy is OK

### Sprint 2: Make it good

- Proper abstractions
- Handle edge cases
- Professional appearance
- Still some tech debt OK

### Sprint 3: Make it right

- Clean architecture
- Comprehensive tests
- Performance optimized
- Production quality

## DEFINITION OF DONE ✅

**Sprint 0**: Screenshot of badge on real website  
**Sprint 1**: All detected prices show as badges with no crashes  
**Sprint 2**: Badges look professional and work across multiple sites  
**Sprint 3**: Full test coverage and ready for user rollout

## ANTI-PATTERNS TO AVOID ⚠️

- ❌ Waiting for perfect design before coding
- ❌ Building test infrastructure before feature
- ❌ Optimizing before measuring performance problems
- ❌ Adding complexity that doesn't serve users
- ❌ Perfectionism blocking iteration
