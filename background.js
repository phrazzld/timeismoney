chrome.browserAction.onClicked.addListener(function() {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.runtime.openOptionsPage();
});
