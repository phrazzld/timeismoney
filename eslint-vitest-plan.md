# Plan for Adding ESLint Rules to Enforce Vitest Patterns

## Current ESLint Configuration

The project currently has an ESLint configuration that includes:

1. Overrides for Vitest test files (`**/*.vitest.test.js`) that disable JSDoc requirements
2. Overrides for Jest test files (`**/*.test.js`, `**/*.spec.js`) that:
   - Define global variables like `describe`, `it`, `test`, `expect`, etc.
   - Disable JSDoc requirements

## Desired Outcomes

1. Ensure new test files follow Vitest patterns
2. Prevent using Jest globals in new test files
3. Enforce importing Vitest functions from our helper file
4. Ensure proper file naming conventions (.vitest.test.js)
5. Encourage proper test structure

## ESLint Rule Changes

### 1. Create a new ESLint plugin for Vitest

Create a simple ESLint plugin (`eslint-plugin-vitest-patterns`) with custom rules:

- `prefer-vitest-imports`: Require importing from our vitest-imports.js helper
- `no-jest-globals`: Disallow using Jest globals without importing
- `prefer-resetTestMocks`: Encourage using resetTestMocks in beforeEach

### 2. Update ESLint Configuration for Vitest Files

Modify the ESLint configuration to:

1. Add a specific override for `**/*.vitest.test.js` files
2. Apply stricter rules for these files
3. Configure our custom rules

### 3. Implementation Strategy

We have two options:

#### Option 1: Use Existing ESLint Rules with Custom Configuration

- Use existing rules like `no-restricted-globals`, `import/no-restricted-paths`
- Configure them specifically for our Vitest requirements
- This approach is simpler but less customizable

#### Option 2: Create Custom Rules (More Complex)

- Create custom ESLint rules in a local plugin
- This gives us more flexibility but requires more effort

For this task, we'll start with Option 1 since it's simpler and can be implemented quickly.

## Implementation Steps

1. Install required ESLint plugins if needed
2. Update `.eslintrc.json` with new rules
3. Test the configuration with example test files
4. Document the new rules in our VITEST-PATTERNS.md guide

## Specific Rule Changes

1. Add `no-restricted-globals` rule to prevent using Jest globals
2. Add `no-restricted-syntax` to check for common Jest patterns
3. Add warning for missing imports from vitest-imports.js

## Expected Result

After implementing these changes, ESLint will:

- Warn or error when developers use Jest globals in new .vitest.test.js files
- Encourage using proper Vitest imports
- Guide developers toward our documented testing patterns
