# Plan for Pull Request Template with Migration Checklist

## Purpose

Create a pull request template that includes a comprehensive checklist for migrating test files from Jest to Vitest. This will help ensure consistent migration practices across the project and prevent common issues.

## Template Structure

1. **PR Description Section**

   - Title format guidance
   - Description requirements
   - Link to related issue(s)

2. **Vitest Migration Checklist**

   - File organization and naming
   - Import patterns
   - Mocking approaches
   - Async testing
   - Test cleanup

3. **General PR Checklist**
   - Code quality checks
   - Test coverage
   - Documentation
   - Performance considerations

## Implementation Approach

1. Create a `.github` directory if it doesn't exist
2. Create a pull request template file in the appropriate location
3. Structure the template with clear sections and detailed checklist items
4. Include guidance and examples for each section
5. Add references to relevant documentation

## Expected Location

The template should be placed at `.github/pull_request_template.md` to be automatically loaded when creating a pull request on GitHub.

## Template Content

The template will include:

1. **Title and Description Guidelines**

   - Format requirements for PR titles (e.g., "fix: migrate X test to Vitest")
   - Required information in the description
   - Links to related issues

2. **Vitest Migration Specific Checklist**

   - Proper file naming (\*.vitest.test.js)
   - Imports from vitest-imports.js helper
   - Use of resetTestMocks() in beforeEach
   - Proper async test patterns
   - No direct Jest globals or methods

3. **Testing Checklist**

   - All tests pass
   - Test coverage maintained or improved
   - No regressions in functionality

4. **Code Quality Checklist**

   - ESLint passes with no errors or warnings
   - Code follows project style and patterns
   - No debug console logs
   - Proper error handling

5. **Documentation Checklist**

   - Updated comments if needed
   - Migration notes for complex changes

6. **References**
   - Link to Vitest migration guide
   - Link to project's testing standards
