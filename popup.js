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

//initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();

  const enable = document.getElementById('enabled');
  enable.addEventListener('change', (event) => {
    if (event.target.checked) {
      chrome.storage.sync.set({ disabled: false });
    } else {
      chrome.storage.sync.set({ disabled: true });
    }
  });

  const options = document.getElementById('options');
  options.onclick = () => {
    chrome.runtime.openOptionsPage();
  };
});
