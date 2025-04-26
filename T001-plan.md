# T001 · Chore · P2: remove legacy root-level extension assets

## Task Details
- **Context:** cr-01 step 1
- **Action:**
    1. Delete root-level `manifest.json`, `popup.*`, and `options.*` files.
- **Done-when:**
    1. No `manifest.json`, `popup.*`, or `options.*` exist at the project root.
- **Depends-on:** none

## Plan
1. First, verify the presence of equivalent files in the src/ directory to ensure we're not losing any unique content
2. List and confirm all the files that need to be removed:
   - manifest.json
   - popup.html
   - popup.js
   - popup.css
   - options.html
   - options.js
3. Remove the identified files
4. Verify that all removed files have equivalent counterparts in src/
5. Verify the task completion criteria: no manifest.json, popup.*, or options.* exist at the project root

## Classification
This is a **Simple** task as it involves straightforward file removal with clear acceptance criteria.