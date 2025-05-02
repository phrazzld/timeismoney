/**
 * Jest configuration for TimeIsMoney extension
 */
module.exports = {
  // Indicates test environment
  testEnvironment: 'jsdom',

  // The root directory where Jest should scan for tests
  roots: ['<rootDir>/src'],

  // File patterns for test files
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],

  // Ignore patterns for tests
  testPathIgnorePatterns: [
    '/node_modules/',
    'test-helpers.js',
    'priceFinder.test.patch.js'
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'mjs'],

  // Setup files run before each test
  setupFiles: ['<rootDir>/jest.setup.cjs'],

  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },

  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)',
  ],

  // Indicate coverage collection
  collectCoverage: false,

  // Directory where coverage reports will be stored
  coverageDirectory: 'coverage',

  // Set tests to use fake timers and provide proper URL for JSDOM
  testEnvironmentOptions: {
    pretendToBeVisual: true,
    url: 'http://localhost'
  },

  // Mock modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Run sequentially in CI to avoid memory issues
  ...(process.env.CI ? { maxWorkers: 1 } : {}),
};