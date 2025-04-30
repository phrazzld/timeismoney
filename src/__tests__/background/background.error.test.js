/**
 * Tests for storage error handling in the background script
 */
import * as storage from '../../utils/storage';

// Import functions from background.js
// Note: We need to use dynamic import since background.js has side effects
// that we want to control in tests
let handleExtensionInstalled;
let initializeIcon;

describe('Background Script Error Handling', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Clear the module cache to prevent state between tests
    jest.resetModules();

    // Mock console.error so it doesn't pollute test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock chrome API implementations needed for background.js
    chrome.action.setIcon = jest.fn();
    chrome.runtime.openOptionsPage = jest.fn();
  });

  describe('handleExtensionInstalled', () => {
    beforeEach(async () => {
      // Import the modules for each test to avoid shared state
      const backgroundModule = await import('../../background/background.js');

      // Extract the function we're testing using the module's internal structure
      // This is a bit hacky, but necessary since the functions aren't exported
      const backgroundProto = Object.getPrototypeOf(backgroundModule);
      handleExtensionInstalled = Object.getOwnPropertyNames(backgroundProto)
        .filter((prop) => typeof backgroundProto[prop] === 'function')
        .map((name) => backgroundProto[name])
        .find((func) => func.toString().includes('handleExtensionInstalled'));
    });

    it('should handle saveSettings error during new installation', async () => {
      // Mock saveSettings to reject with an error
      jest.spyOn(storage, 'saveSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during install'));
      });

      // Call handleExtensionInstalled with 'install' reason
      const details = { reason: 'install' };
      handleExtensionInstalled(details);

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify error is logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save default settings on extension install:',
        expect.objectContaining({
          message: 'Storage error during install',
        })
      );
    });

    it('should handle getSettings error during update', async () => {
      // Mock getSettings to reject with an error
      jest.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during update read'));
      });

      // Call handleExtensionInstalled with 'update' reason
      const details = { reason: 'update' };
      handleExtensionInstalled(details);

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify error is logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to read existing settings during extension update:',
        expect.objectContaining({
          message: 'Storage error during update read',
        })
      );
    });

    it('should handle saveSettings error after getSettings error during update', async () => {
      // Mock getSettings to reject with an error
      jest.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during update read'));
      });

      // Mock saveSettings to also reject with an error for fallback
      jest.spyOn(storage, 'saveSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during update fallback save'));
      });

      // Call handleExtensionInstalled with 'update' reason
      const details = { reason: 'update' };
      handleExtensionInstalled(details);

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify both errors are logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to read existing settings during extension update:',
        expect.objectContaining({
          message: 'Storage error during update read',
        })
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save default settings after read error during update:',
        expect.objectContaining({
          message: 'Storage error during update fallback save',
        })
      );
    });
  });

  describe('initializeIcon', () => {
    beforeEach(async () => {
      // Import the modules for each test to avoid shared state
      const backgroundModule = await import('../../background/background.js');

      // Extract the function we're testing
      const backgroundProto = Object.getPrototypeOf(backgroundModule);
      initializeIcon = Object.getOwnPropertyNames(backgroundProto)
        .filter((prop) => typeof backgroundProto[prop] === 'function')
        .map((name) => backgroundProto[name])
        .find((func) => func.toString().includes('initializeIcon'));
    });

    it('should handle getSettings error during icon initialization', async () => {
      // Mock getSettings to reject with an error
      jest.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during icon init'));
      });

      // Call initializeIcon
      await initializeIcon();

      // Verify error is logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize extension icon due to storage error:',
        expect.objectContaining({
          message: 'Storage error during icon init',
        })
      );

      // Verify icon was not set due to the error
      expect(chrome.action.setIcon).not.toHaveBeenCalled();
    });
  });
});
