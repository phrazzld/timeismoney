# Node.js Version Management Strategy for CI

## Current State Analysis

- The project has two almost identical workflow files: `ci.yml` and `ci-fix.yml`
- Node.js is specified in three places in each workflow file (lint, test, and build jobs)
- The project requires Node.js >=20.0.0 as specified in package.json
- The project has an existing `.nvmrc` file with version 16 (outdated)
- A recent issue occurred where `ci-fix.yml` had Node.js 18.x while package.json required >=20.0.0

## Approaches Evaluated

### 1. Using `node-version-file: '.nvmrc'` with a root `.nvmrc` file

#### Pros

- Simple approach with minimal configuration changes
- `.nvmrc` file is already used by many developers and tools like nvm
- Single source of truth for Node.js version across both local development and CI
- Straightforward to update (change one file)
- Built-in feature of the actions/setup-node action
- Uses GitHub's caching mechanism for Node versions

#### Cons

- Requires updating the existing outdated `.nvmrc` file (currently version 16)
- May not work smoothly with matrix testing if multiple Node.js versions need to be tested

### 2. Using Reusable Workflows/Composite Actions

#### Pros

- Powerful for standardizing entire workflows across multiple repositories
- Supports passing parameters, secrets, and outputs
- Can encapsulate complex logic for Node.js setup and caching
- Enables broader CI/CD standardization

#### Cons

- More complex to set up initially
- Might be overkill for a single repository with just two workflow files
- Requires creating a new workflow file and restructuring existing workflows
- Steeper learning curve for contributors

## Recommendation

**Use the `node-version-file: '.nvmrc'` approach** for the following reasons:

1. **Simplicity**: This approach requires minimal changes to existing workflows.
2. **Developer Familiarity**: `.nvmrc` is a standard file that many developers are already familiar with.
3. **Single Source of Truth**: Maintains one file for both local development and CI environments.
4. **Project Scope**: The project has only two workflow files in a single repository, making reusable workflows potentially excessive.
5. **Quick Win**: Fastest path to preventing similar version issues in the future.

## Implementation Plan

1. Update the existing `.nvmrc` file to specify version 20.x
2. Modify all Node.js setup steps in CI workflow files to use:
   ```yaml
   - name: Set up Node.js
     uses: actions/setup-node@v3
     with:
       node-version-file: '.nvmrc'
   ```
3. Add documentation about the Node.js version management approach to help future contributors understand the setup.

## Future Considerations

- If the project expands to multiple repositories with similar CI needs, revisit the reusable workflows approach.
- Consider adding a CI check that verifies the `.nvmrc` file matches the requirements in package.json.
