/**
 * Setup file for Jest tests
 * Mocks Chrome APIs needed for testing
 */

// Create mock Chrome API
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    getManifest: () => ({
      version: '1.0.0',
    }),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  browserAction: {
    setIcon: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  i18n: {
    getMessage: jest.fn(),
  },
};
