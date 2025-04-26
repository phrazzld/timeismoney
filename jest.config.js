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
  testPathIgnorePatterns: ['/node_modules/'],

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Setup files run before each test
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Indicate coverage collection
  collectCoverage: false,

  // Directory where coverage reports will be stored
  coverageDirectory: 'coverage',

  // Mock modules
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
