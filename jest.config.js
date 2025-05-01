/**
 * Jest configuration for TimeIsMoney extension
 */
export default {
  // Indicates test environment
  testEnvironment: 'jsdom',

  // The root directory where Jest should scan for tests
  roots: ['<rootDir>/src'],

  // File patterns for test files
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],

  // Ignore patterns for tests
  testPathIgnorePatterns: ['/node_modules/'],

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'mjs'],

  // Setup files run before each test
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)',
  ],

  // Indicate coverage collection
  collectCoverage: false,

  // Directory where coverage reports will be stored
  coverageDirectory: 'coverage',

  // Set tests to use fake timers
  testEnvironmentOptions: {
    pretendToBeVisual: true,
  },

  // Mock modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
