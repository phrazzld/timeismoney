function restoreOptions() {
    chrome.storage.sync.get({
	disabled: false}, function (items) {
	    document.getElementById("enabled").checked = !items.disabled;
	});
}

//initial display for popup menu when opened
document.addEventListener('DOMContentLoaded', function() {
    restoreOptions();
    
    const enable = document.getElementById("enabled");
    enable.addEventListener("change", (event) => {
	if (event.target.checked) {
	    chrome.storage.sync.set({disabled: false});
	    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {enable: "true"}, function(response) {});
	    });
	}
	else {
	    chrome.storage.sync.set({disabled: true});
	    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {enable: "false"}, function(response) {});
	    });
	}
    })
    
    const options = document.getElementById("options");
    options.onclick = () => {chrome.runtime.openOptionsPage()};
    
    const git = document.getElementById("GitHub");
    git.onclick = () => {
	chrome.tabs.create(
	    {url: "https://github.com/phrazzld/timeismoney"}
	)};
});
