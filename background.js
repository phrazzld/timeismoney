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

// function createToggleMenu(disable) {
//   chrome.contextMenus.removeAll()
//   chrome.contextMenus.create({
//     title: disable ? chrome.i18n.getMessage('disable') : chrome.i18n.getMessage('enable'),
//     contexts: ['browser_action'],
//     onclick: function() {
//       chrome.storage.sync.set({
//         disabled: disable
//       }, function() {
//         createToggleMenu(!disable)
//       })
//     }
//   })
// }
//
// createToggleMenu(true)
