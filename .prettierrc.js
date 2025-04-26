// Prettier configuration file
// Based on CLAUDE.md guidelines
module.exports = {
  // Core formatting settings
  singleQuote: true, // Use single quotes for strings
  trailingComma: 'es5', // Add trailing commas where ES5 allows
  semi: true, // Always use semicolons
  tabWidth: 2, // 2-space indentation
  printWidth: 100, // 100 character line limit

  // Additional standardized settings
  bracketSpacing: true, // Print spaces between brackets in object literals
  arrowParens: 'always', // Always include parentheses around arrow function parameters
  endOfLine: 'lf', // Consistent line endings across platforms
  quoteProps: 'as-needed', // Only quote object properties when needed
  jsxSingleQuote: true, // Use single quotes in JSX for consistency
  bracketSameLine: false, // Put the > of a multi-line HTML element on a new line
  useTabs: false, // Use spaces, not tabs
};
