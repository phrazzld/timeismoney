chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if(request.method == "getLocal"){
		sendResponse({show_alert: localStorage["show_alert"], 
					  using: localStorage["using"],
					  wage: localStorage["wage"],
					  salary: localStorage["salary"]});
	} else {
		sendResponse({}); }
});

if(jQuery){
	chrome.browserAction.onClicked.addListener(function(tab) {
	  console.log("converting");
	  chrome.tabs.executeScript(tab.id, { "file": "convert.js" }, 
	  	function() {
	  		console.log("script executed");
	  	});
	});
} else { }





