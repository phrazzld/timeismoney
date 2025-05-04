/**
 * DOM-specific setup for JSDOM environment tests
 * This file is loaded only for tests running in JSDOM environment
 */

// Ensure the window and document are properly configured
if (typeof window !== 'undefined') {
  // Set up window location if needed
  if (!window.location) {
    window.location = new URL('http://localhost');
  }

  // Set up document title if needed
  if (typeof document !== 'undefined' && !document.title) {
    document.title = 'Time Is Money Test Environment';
  }
}

// Set up fake timers for DOM tests if needed
// This helps with predictable timing for animations, observers, etc.
beforeEach(() => {
  // Clean up any DOM modifications from previous tests
  if (document && document.body) {
    document.body.innerHTML = '';
  }

  // Reset any attached event listeners
  // (Will be implemented if needed by specific tests)
});

// Set up any DOM-specific global helpers

/**
 * Helper function to simulate DOM events
 *
 * @param {Element} element - The DOM element to trigger the event on
 * @param {string} eventType - The event type (e.g., 'click', 'input')
 * @param {object} options - Additional event options
 */
globalThis.simulateEvent = (element, eventType, options = {}) => {
  const event = new Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...options,
  });

  element.dispatchEvent(event);
};

/**
 * Helper function to wait for DOM mutations to complete
 * Useful for tests that involve MutationObserver
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} A promise that resolves after the specified time
 */
globalThis.waitForMutations = (ms = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
