# T003 · Test · P2: smoke-test extension locally and in CI

## Task Details
- **Context:** cr-01 step 3
- **Action:**
    1. Load the built extension locally and verify all UI functions correctly.
    2. Ensure the CI smoke-test job runs the extension and passes.
- **Done-when:**
    1. Manual UI verification succeeds and CI smoke-test passes without errors.
- **Depends-on:** [T002]

## Plan

### Part 1: Local Verification
1. Create a packaged extension with the current codebase
2. Load the extension in Chrome and verify basic functionality:
   - Extension icon appears and can be clicked
   - Popup UI loads correctly and displays toggle
   - Options page loads with all form fields
   - Basic price conversion works on a test webpage (e.g., Amazon)

### Part 2: CI Verification
1. Check if an existing smoke test exists in CI
2. If not, create a simple smoke test script to verify the extension loads
3. Update the CI workflow to run the smoke test
4. Verify the CI workflow passes with the new smoke test

## Classification
This is a **Simple** task as it involves manual testing and simple CI configuration updates. No complex logic changes are required, just verification of existing functionality.