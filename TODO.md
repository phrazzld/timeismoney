# Todo

## project-cleanup
- [x] **T001 · Chore · P2: remove legacy root-level extension assets**
    - **Context:** cr-01 step 1
    - **Action:**
        1. Delete root-level `manifest.json`, `popup.*`, and `options.*` files.
    - **Done-when:**
        1. No `manifest.json`, `popup.*`, or `options.*` exist at the project root.
    - **Depends-on:** none

- [x] **T002 · Chore · P2: update build and CI to use src assets**
    - **Context:** cr-01 step 2
    - **Action:**
        1. Modify build scripts and GitHub Actions workflows to reference `src/manifest.json` and other assets under `src/`.
    - **Done-when:**
        1. CI build and local build use assets exclusively from `src/` and complete successfully.
    - **Depends-on:** [T001]

- [x] **T003 · Test · P2: smoke-test extension locally and in CI**
    - **Context:** cr-01 step 3
    - **Action:**
        1. Load the built extension locally and verify all UI functions correctly.
        2. Ensure the CI smoke-test job runs the extension and passes.
    - **Done-when:**
        1. Manual UI verification succeeds and CI smoke-test passes without errors.
    - **Depends-on:** [T002]

## converter
- [x] **T004 · Refactor · P2: merge converter logic into src/utils/converter.js**
    - **Context:** cr-02 step 1
    - **Action:**
        1. Consolidate `normalizePrice`, `calculateHourlyWage`, and formatting logic from `src/content/priceConverter.js` into `src/utils/converter.js`, ensuring a unified API.
    - **Done-when:**
        1. `src/utils/converter.js` implements all conversion functions and exports a consistent interface covering both original modules.
    - **Depends-on:** none

- [x] **T005 · Refactor · P2: update content scripts to use unified converter**
    - **Context:** cr-02 step 2
    - **Action:**
        1. Replace imports from `src/content/priceConverter.js` with imports from `src/utils/converter.js` in all content scripts.
    - **Done-when:**
        1. No content scripts reference `src/content/priceConverter.js` and use the functions from `src/utils/converter.js`.
    - **Depends-on:** [T004]

- [x] **T006 · Chore · P2: remove deprecated priceConverter module**
    - **Context:** cr-02 step 3
    - **Action:**
        1. Delete the `src/content/priceConverter.js` file from the repository.
    - **Done-when:**
        1. `src/content/priceConverter.js` is removed and the project builds without errors.
    - **Depends-on:** [T005]

- [x] **T007 · Test · P2: expand unit tests for merged converter**
    - **Context:** cr-02 step 4
    - **Action:**
        1. Add Jest test cases covering all edge cases and API behaviors from both original converter modules to the tests for `src/utils/converter.js`.
    - **Done-when:**
        1. Unit tests for `src/utils/converter.js` cover previous scenarios and pass.
    - **Depends-on:** [T004]

## lint-and-format
- [x] **T008 · Chore · P2: merge ESLint rules into .eslintrc.js**
    - **Context:** cr-03 step 1
    - **Action:**
        1. Copy and integrate custom rules from `.eslintrc.json` into `.eslintrc.js`, resolving any conflicts.
    - **Done-when:**
        1. `.eslintrc.js` contains all intended rules and no relevant settings remain in `.eslintrc.json`.
    - **Depends-on:** none

- [x] **T009 · Chore · P2: delete .eslintrc.json**
    - **Context:** cr-03 step 2
    - **Action:**
        1. Remove the `.eslintrc.json` file from the repository.
    - **Done-when:**
        1. `.eslintrc.json` no longer exists and ESLint runs solely with `.eslintrc.js`.
    - **Depends-on:** [T008]

- [x] **T010 · Chore · P2: validate and update Prettier configuration**
    - **Context:** cr-03 step 3
    - **Action:**
        1. Review `.prettierrc` and ensure it contains all desired formatting options; update if necessary.
    - **Done-when:**
        1. `.prettierrc` reflects project formatting standards and no formatting issues are reported.
    - **Depends-on:** none

- [x] **T011 · Chore · P2: run lint and format fixes**
    - **Context:** cr-03 step 4
    - **Action:**
        1. Execute `eslint --fix .` and `prettier --write .` across the codebase.
    - **Done-when:**
        1. No lint or formatting errors remain after running the tools.
    - **Depends-on:** [T008, T009, T010]

## dom-scanning
- [x] **T012 · Feature · P2: implement MutationObserver for DOM scanning**
    - **Context:** cr-04 step 1
    - **Action:**
        1. Instantiate a `MutationObserver` on `document.body` to detect added or changed nodes.
    - **Done-when:**
        1. The observer correctly fires on DOM mutations in content scripts.
    - **Depends-on:** none

- [x] **T013 · Refactor · P2: debounce domScanner.walk calls**
    - **Context:** cr-04 step 2
    - **Action:**
        1. Replace immediate full DOM scan calls with a debounced (200 ms) invocation of `domScanner.walk` triggered by the observer.
    - **Done-when:**
        1. `domScanner.walk` is called only after the debounce delay on observed mutations.
    - **Depends-on:** [T012]

- [x] **T014 · Refactor · P2: disconnect MutationObserver on script unload**
    - **Context:** cr-04 step 3
    - **Action:**
        1. Add cleanup logic to disconnect the `MutationObserver` when the content script unloads.
    - **Done-when:**
        1. Observer is reliably disconnected during script teardown without errors.
    - **Depends-on:** [T012]

- [x] **T015 · Test · P2: benchmark and verify optimized scanning**
    - **Context:** cr-04 step 4
    - **Action:**
        1. Measure DOM scan time before and after optimizations and confirm ≥ 50 % reduction.
        2. Validate that all target nodes are still processed correctly.
    - **Done-when:**
        1. Benchmarks show at least 50 % scan-time improvement and functional behavior is unchanged.
    - **Depends-on:** [T013, T014]

## integration-tests
- [x] **T016 · Chore · P2: configure Jest to use JSDOM environment**
    - **Context:** cr-05 step 1
    - **Action:**
        1. Set `testEnvironment` to `jsdom` in Jest configuration.
        2. Install `jsdom` if not already present as a dev dependency.
    - **Done-when:**
        1. Jest tests run in a JSDOM environment and a simple DOM-access test passes.
    - **Depends-on:** none

- [ ] **T017 · Test · P2: add DOM conversion integration tests**
    - **Context:** cr-05 steps 2 & 3
    - **Action:**
        1. Create JSDOM fixtures with sample text nodes and price elements.
        2. Write tests asserting `applyConversion` adds time strings and `revertAll` restores originals.
    - **Done-when:**
        1. Integration tests cover conversion and revert scenarios and pass in CI.
    - **Depends-on:** [T016]

- [ ] **T018 · Chore · P2: integrate new tests into CI pipeline**
    - **Context:** cr-05 step 4
    - **Action:**
        1. Update CI workflows to run the new JSDOM-based integration tests.
    - **Done-when:**
        1. CI pipeline includes and passes the integration tests.
    - **Depends-on:** [T017]

### Clarifications & Assumptions
- none