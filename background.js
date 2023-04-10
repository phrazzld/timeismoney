chrome.browserAction.onClicked.addListener(function() {
  chrome.runtime.openOptionsPage()
})

chrome.runtime.onInstalled.addListener(function() {
  chrome.runtime.openOptionsPage()
  chrome.storage.sync.set({
    disabled: false,
    currencySymbol: '$',
    currencyCode: 'USD',
    frequency: 'hourly',
    amount: '15.00',
    thousands: 'commas',
    decimal: 'dot'
  })
})

chrome.storage.onChanged.addListener(changes => {
  if (changes.disabled) {
    if (changes.disabled.newValue) {
      chrome.browserAction.setIcon({path: "images/icon_disabled_38.png"});
    } else {
      chrome.browserAction.setIcon({path: "images/icon_38.png"});
    }
  }
});
