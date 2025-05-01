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
  action: {
    setIcon: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  i18n: {
    getMessage: jest.fn(),
  },
};

// Fix JSDOM window.location issue
// This ensures window.location is properly initialized
if (typeof window !== 'undefined') {
  // Only do this if we're in a JSDOM environment
  if (window.location === undefined || window.location === null) {
    delete window.location;
    window.location = new URL('http://localhost');
  }
}

// Mock Performance API for tests that need it
if (typeof performance === 'undefined') {
  global.performance = {
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
  };
}

// Helper function to set up common DOM elements
// This will be imported in test files that need it
global.setupTestDom = () => {
  // Ensure document and body exist
  if (typeof document === 'undefined' || !document.body) {
    // If we're in a test environment where document isn't properly set up
    // Return without trying to manipulate the DOM
    return;
  }
  
  // Reset the document body before each test
  document.body.innerHTML = '';
  
  // Create status element used by many tests
  const statusElement = document.createElement('div');
  statusElement.id = 'status';
  document.body.appendChild(statusElement);
  
  // Create common form elements used in options tests
  const createFormElement = (id, type = 'text', value = '') => {
    const element = document.createElement('input');
    element.id = id;
    element.type = type;
    element.value = value;
    document.body.appendChild(element);
    return element;
  };
  
  createFormElement('currency-symbol', 'text', '$');
  createFormElement('currency-code', 'text', 'USD');
  createFormElement('amount', 'text', '15.00');
  createFormElement('frequency', 'select', 'hourly');
  createFormElement('thousands', 'select', 'commas');
  createFormElement('decimal', 'select', 'dot');
  createFormElement('debounce-interval', 'number', '200');
  createFormElement('enable-dynamic-scanning', 'checkbox').checked = true;
};

// Setup for ES modules in Jest
globalThis.jest = jest;

// Create a helper that can be used in each test file to reset mocks
global.resetTestMocks = () => {
  jest.clearAllMocks();
};