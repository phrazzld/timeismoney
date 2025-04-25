# Todo

## General Codebase Improvements
- [x] **T001 · Chore · P2: configure ESLint & Prettier**
    - **Context:** 2.1 General Codebase Improvements – Configure ESLint & Prettier
    - **Action:**
        1. Add ESLint and Prettier config files to repo.
        2. Add npm scripts for linting (`npm run lint`) and formatting (`npm run format`).
    - **Done-when:**
        1. `npm run lint` and `npm run format` succeed without errors.
        2. All existing `.js` files formatted according to rules.
    - **Depends-on:** none

- [x] **T002 · Refactor · P2: adopt ES6 syntax across codebase**
    - **Context:** 2.1 General Codebase Improvements – Adopt ES6+ style
    - **Action:**
        1. Replace `var` with `const`/`let`, convert functions to arrow syntax where appropriate.
        2. Use template literals instead of string concatenation.
    - **Done-when:**
        1. No occurrences of `var` remain.
        2. Codebase uses arrow functions and template literals consistently.
    - **Depends-on:** T001

- [x] **T003 · Chore · P2: add JSDoc comments for public APIs**
    - **Context:** 2.1 General Codebase Improvements – Add JSDoc comments
    - **Action:**
        1. Document every exported function/module with JSDoc blocks.
        2. Verify JSDoc covers parameters, return types, and examples if applicable.
    - **Done-when:**
        1. All public functions have JSDoc comments.
        2. JSDoc generation (if configured) runs without missing warnings.
    - **Depends-on:** T002

- [x] **T004 · Chore · P2: reorganize file structure under /src**
    - **Context:** 2.1 General Codebase Improvements – Reorganize file structure
    - **Action:**
        1. Create directories as per plan (`/src/{background,content,options,popup,utils}`).
        2. Move existing `.js` and asset files into their new locations, update import paths.
    - **Done-when:**
        1. Project builds with no import errors.
        2. Directory structure matches plan.
    - **Depends-on:** T001

- [x] **T005 · Refactor · P2: consolidate storage interactions behind storage.js API**
    - **Context:** 2.1 General Codebase Improvements – Consolidate storage calls
    - **Action:**
        1. Implement `getSettings()`, `saveSettings()`, `onSettingsChanged()` in `src/utils/storage.js`.
        2. Remove direct `chrome.storage.sync` calls and replace with storage API.
    - **Done-when:**
        1. No direct `chrome.storage.sync` usage remains.
        2. All modules call storage via storage.js.
    - **Depends-on:** T004

## Content Module Refactor
- [x] **T006 · Refactor · P2: extract settingsManager.js from content.js**
    - **Context:** 2.2 Refactor content.js – Split responsibilities: settingsManager.js
    - **Action:**
        1. Move settings loading/subscription logic into `src/content/settingsManager.js`.
        2. Export functions for `initSettings()` and `onSettingsChange()`.
    - **Done-when:**
        1. `content/index.js` imports and uses settingsManager instead of inline code.
        2. Settings change events delivered correctly.
    - **Depends-on:** T005

- [x] **T007 · Refactor · P2: extract domScanner.js with walk API**
    - **Context:** 2.2 Refactor content.js – Split responsibilities: domScanner.js
    - **Action:**
        1. Create `src/content/domScanner.js` exporting `walk(root, callback)`.
        2. Delete equivalent code from content.js and update imports.
    - **Done-when:**
        1. Text nodes are traversed using new `walk` function.
        2. No duplicate TreeWalker code remains.
    - **Depends-on:** T006

- [x] **T008 · Refactor · P2: extract priceFinder.js with findPrices**
    - **Context:** 2.2 Refactor content.js – Split responsibilities: priceFinder.js
    - **Action:**
        1. Implement `findPrices(text, formatSettings)` in `src/content/priceFinder.js`.
        2. Build and cache regex patterns according to user settings.
    - **Done-when:**
        1. `findPrices` returns correct matches for sample strings.
        2. Content processor uses `findPrices` exclusively.
    - **Depends-on:** T007

- [x] **T009 · Refactor · P2: extract priceConverter.js with convert and format**
    - **Context:** 2.2 Refactor content.js – Split responsibilities: priceConverter.js
    - **Action:**
        1. Create `src/content/priceConverter.js` exporting `convertToTime(price, wage)` and `formatTimeSnippet(h, m)`.
        2. Remove conversion logic from content.js.
    - **Done-when:**
        1. Conversions match previous behavior for test cases.
        2. All conversions performed via new module.
    - **Depends-on:** T008

- [x] **T010 · Refactor · P2: extract domModifier.js for applying and reverting conversions**
    - **Context:** 2.2 Refactor content.js – Split responsibilities: domModifier.js
    - **Action:**
        1. Implement `applyConversion(node, match, snippet)` and `revertAll(root)` in `src/content/domModifier.js`.
        2. Wrap converted text in spans with `data-original-price`.
    - **Done-when:**
        1. Conversions appear in DOM exactly as before.
        2. Calling `revertAll` restores original text.
    - **Depends-on:** T009

- [x] **T011 · Refactor · P2: implement content/index.js orchestrator**
    - **Context:** 2.2 Refactor content.js – Orchestrator
    - **Action:**
        1. In `src/content/index.js`, import all modules and replicate init, processPage, and settings-change logic.
        2. Replace old content.js in manifest entry.
    - **Done-when:**
        1. Extension behavior identical on page load and settings change.
        2. No residual code in original content.js.
    - **Depends-on:** [T006, T007, T008, T009, T010]

- [x] **T012 · Feature · P2: isolate amazon-specific logic into amazonHandler.js**
    - **Context:** 2.2 Refactor content.js – Amazon-specific logic
    - **Action:**
        1. Move existing Amazon hacks into `src/content/amazonHandler.js` with clear API.
        2. Integrate handler into priceFinder or orchestrator.
    - **Done-when:**
        1. Amazon-specific cases still pass existing sample tests.
        2. All Amazon logic lives in amazonHandler.js.
    - **Depends-on:** T008

- [x] **T013 · Refactor · P2: replace bare throw strings with Error objects**
    - **Context:** 2.2 Refactor content.js – Error handling
    - **Action:**
        1. Find all `throw 'message'` and convert to `throw new Error('message')`.
    - **Done-when:**
        1. No `throw` statements without `new Error`.
    - **Depends-on:** none

- [ ] **T014 · Refactor · P2: wrap critical sections in try/catch with logging**
    - **Context:** 2.2 Refactor content.js – Error handling
    - **Action:**
        1. Identify critical code in orchestrator and wrap in `try/catch`.
        2. Log errors to console with context.
    - **Done-when:**
        1. Errors during scanning or conversion are caught and logged.
        2. Extension does not crash on unexpected input.
    - **Depends-on:** T011

## Options Module Refactor
- [ ] **T015 · Refactor · P2: extract formHandler.js for options form logic**
    - **Context:** 2.3 Refactor options.js – Modularize formHandler.js
    - **Action:**
        1. Move form loading, validation, and save logic into `src/options/formHandler.js`.
        2. Export `loadForm()` and `setupListeners()`.
    - **Done-when:**
        1. Options page loads and saves via formHandler.
        2. No form logic remains in options.js.
    - **Depends-on:** T005, T004

- [ ] **T016 · Refactor · P2: extract tooltip.js for delegated help text**
    - **Context:** 2.3 Refactor options.js – Modularize tooltip.js
    - **Action:**
        1. Implement delegated `focusin`/`focusout` handlers in `src/options/tooltip.js`.
        2. Remove inline tooltip logic from options.js.
    - **Done-when:**
        1. Tooltips show/hide correctly on focus events.
        2. No tooltip code in formHandler or options.js.
    - **Depends-on:** T015

- [ ] **T017 · Refactor · P2: integrate parser.js for amount string normalization**
    - **Context:** 2.3 Refactor options.js – Parsing/Formatting
    - **Action:**
        1. Use `normalizeAmountString` from `src/utils/parser.js` in form submission.
        2. Remove custom normalization code.
    - **Done-when:**
        1. Amount strings parse correctly in tests.
        2. No duplicate normalization logic.
    - **Depends-on:** T005

- [ ] **T018 · Feature · P2: enforce numeric, non-negative wage validation**
    - **Context:** 2.3 Refactor options.js – Validation
    - **Action:**
        1. In `formHandler.js`, validate wage inputs on submit.
        2. Display inline error messages and prevent saving invalid data.
    - **Done-when:**
        1. Invalid values trigger visible error and block save.
        2. Valid inputs proceed to saveSettings.
    - **Depends-on:** T015

- [ ] **T019 · Refactor · P2: setup DOMContentLoaded entry point in options/index.js**
    - **Context:** 2.3 Refactor options.js – Initialization
    - **Action:**
        1. Create `src/options/index.js` that on `DOMContentLoaded` calls `loadForm()` and `setupListeners()`.
        2. Update manifest to point to new index.js.
    - **Done-when:**
        1. Options page initializes correctly on load.
        2. No leftover code in HTML.
    - **Depends-on:** [T015, T016]

## Popup & Background Refactor
- [ ] **T020 · Refactor · P2: convert anonymous handlers to named functions**
    - **Context:** 2.4 Refactor popup.js & background.js – Named functions
    - **Action:**
        1. Replace inline anonymous event listeners with named handler functions.
        2. Update references accordingly.
    - **Done-when:**
        1. All handlers are named functions.
        2. Behavior unchanged.
    - **Depends-on:** T005

- [ ] **T021 · Refactor · P2: use storage.js API in popup and background**
    - **Context:** 2.4 Refactor popup.js & background.js – Shared storage API
    - **Action:**
        1. Replace `chrome.storage.sync` calls with `getSettings`, `saveSettings` from storage.js.
        2. Remove direct storage imports.
    - **Done-when:**
        1. No direct `chrome.storage.sync` usage in popup/background.
        2. Toggle state persists via storage API.
    - **Depends-on:** T005

- [ ] **T022 · Feature · P2: synchronize popup toggle state and icon with settings**
    - **Context:** 2.4 Refactor popup.js & background.js – State sync
    - **Action:**
        1. On popup open, read `disabled` from storage and set toggle UI.
        2. On toggle change, update icon via background and save setting.
    - **Done-when:**
        1. Toggle reflects actual disabled setting.
        2. Icon state updates instantly on toggle.
    - **Depends-on:** T021

## Testing & CI
- [ ] **T023 · Chore · P2: configure Jest testing framework**
    - **Context:** 5 Testing Strategy – Unit Tests
    - **Action:**
        1. Install Jest and configure `jest.config.js`.
        2. Add npm script `npm test`.
    - **Done-when:**
        1. `npm test` runs and reports no tests.
        2. Test suite recognized by CI.
    - **Depends-on:** T001

- [ ] **T024 · Test · P2: add unit tests for parser.js**
    - **Context:** 5 Testing Strategy – parser.js tests
    - **Action:**
        1. Write test cases in `__tests__/parser.test.js` covering thousands/decimal normalization.
        2. Assert correct output strings and parseFloat behavior.
    - **Done-when:**
        1. All parser tests pass.
    - **Depends-on:** T023

- [ ] **T025 · Test · P2: add unit tests for converter.js**
    - **Context:** 5 Testing Strategy – converter.js tests
    - **Action:**
        1. Write `__tests__/converter.test.js` covering price-to-hours calculations.
        2. Verify formatting of time snippets.
    - **Done-when:**
        1. All converter tests pass.
    - **Depends-on:** T023

- [ ] **T026 · Test · P2: add unit tests for priceFinder.js**
    - **Context:** 5 Testing Strategy – priceFinder.js tests
    - **Action:**
        1. Write `__tests__/priceFinder.test.js` with sample price strings.
        2. Ensure regex matches and indices correct.
    - **Done-when:**
        1. All priceFinder tests pass.
    - **Depends-on:** T023

- [ ] **T027 · Chore · P2: set up GitHub Actions CI for lint and tests**
    - **Context:** 5 Testing Strategy – CI
    - **Action:**
        1. Create `.github/workflows/ci.yml` to run `npm run lint` and `npm test`.
        2. Ensure PRs report status.
    - **Done-when:**
        1. CI pipeline passes on main branch.
    - **Depends-on:** [T001, T023]

## Manifest Migration
- [ ] **T028 · Feature · P1: migrate extension from Manifest V2 to V3**
    - **Context:** 6 Resolved Questions – Manifest V3 migration
    - **Action:**
        1. Update `manifest.json` to v3 schema, replace background scripts with service worker.
        2. Adjust permissions and update any deprecated APIs.
    - **Done-when:**
        1. Extension loads under Manifest V3 without errors.
        2. All functionality preserved.
    - **Depends-on:** T004

### Clarifications & Assumptions
- [ ] **Issue:** clarify amazon-specific logic requirement
    - **Context:** 2.2 Refactor content.js – Amazon-specific logic unclear if still required
    - **Blocking?:** yes