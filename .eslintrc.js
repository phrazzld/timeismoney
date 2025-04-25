/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es6: true,
    webextensions: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'warn',
    'prefer-const': 'warn',
    'no-var': 'warn',
    eqeqeq: ['error', 'always'],
  },
  ignorePatterns: ['node_modules/', 'dist/'],
};
