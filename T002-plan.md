# T002 · Chore · P2: update build and CI to use src assets

## Task Details
- **Context:** cr-01 step 2
- **Action:**
    1. Modify build scripts and GitHub Actions workflows to reference `src/manifest.json` and other assets under `src/`.
- **Done-when:**
    1. CI build and local build use assets exclusively from `src/` and complete successfully.
- **Depends-on:** [T001]

## Plan
1. Examine package.json for build scripts
2. Identify GitHub Actions workflow files (.github/workflows/*.yml)
3. Check for any other build configuration files (webpack.config.js, etc.)
4. Update paths in all identified files to use src/ directory for:
   - manifest.json reference
   - Any paths referring to HTML files (popup, options)
   - Any paths referring to CSS/JS files
5. Verify the changes by running a local build
6. Ensure GitHub Actions workflow will use the updated paths

## Classification
This is a **Simple** task as it involves straightforward path updates in build configuration files.