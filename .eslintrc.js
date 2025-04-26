/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true, // Upgraded from es6
    webextensions: true,
    node: true, // Added from .eslintrc.json
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
    'plugin:jest/recommended', // Added from .eslintrc.json
  ],
  plugins: ['prettier', 'jest'], // Added from .eslintrc.json
  parserOptions: {
    ecmaVersion: 2020, // Keeping this value (12 in the JSON file is equivalent)
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': 'error', // Added from .eslintrc.json
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Kept more specific rule
    'no-unused-vars': 'error', // Using stricter option from .eslintrc.json
    'prefer-const': 'warn',
    'no-var': 'warn',
    eqeqeq: ['error', 'always'],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'jest.config.js', // Added from .eslintrc.json
    'jest.setup.js', // Added from .eslintrc.json
    'babel.config.js', // Added from .eslintrc.json
  ],
  // Added overrides section from .eslintrc.json
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
    },
    {
      // Allow console statements in script files
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
