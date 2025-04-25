/**
 * Restores the enabled/disabled state of the extension toggle
 * Reads from Chrome storage and updates the UI accordingly
 */
const restoreOptions = () => {
  chrome.storage.sync.get(
    {
      disabled: false,
    },
    (items) => {
      document.getElementById('enabled').checked = !items.disabled;
    }
  );
};

// Initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();

  /**
   * Event handler for the extension enable/disable toggle
   * Updates the storage with the new disabled state
   *
   * @param {Event} event - The change event
   */
  const enable = document.getElementById('enabled');
  enable.addEventListener('change', (event) => {
    if (event.target.checked) {
      chrome.storage.sync.set({ disabled: false });
    } else {
      chrome.storage.sync.set({ disabled: true });
    }
  });

  /**
   * Event handler for options button click
   * Opens the options page
   */
  const options = document.getElementById('options');
  options.onclick = () => {
    chrome.runtime.openOptionsPage();
  };
});
