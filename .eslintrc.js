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
    'plugin:jsdoc/recommended', // Added for JSDoc linting
  ],
  plugins: ['prettier', 'jest', 'jsdoc'], // Added jsdoc plugin
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

    // JSDoc custom rules
    'jsdoc/require-jsdoc': [
      'warn',
      {
        publicOnly: false,
        require: {
          FunctionDeclaration: true,
          FunctionExpression: true,
          ArrowFunctionExpression: true,
          ClassDeclaration: true,
          MethodDefinition: true,
        },
      },
    ],
    'jsdoc/require-description': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/require-param-type': 'error',
    'jsdoc/require-returns-type': 'error',
    'jsdoc/valid-types': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/check-param-names': 'error',
    'jsdoc/tag-lines': ['warn', 'any', { startLines: 1 }],
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
      rules: {
        // Relax JSDoc rules for test files
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-description': 'off',
        'jsdoc/require-param-description': 'off',
        'jsdoc/require-returns-description': 'off',
      },
    },
    {
      // Allow console statements in script files
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Relax some JSDoc rules for UI-related files, which are already documented
      files: ['src/popup/**/*.js', 'src/options/**/*.js'],
      rules: {
        'jsdoc/require-jsdoc': 'off', // We've already added JSDoc in T22
      },
    },
  ],
};
