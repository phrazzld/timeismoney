chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if(request.method == "getLocal"){
		sendResponse({wage: localStorage["wage"]});
	} else {
		sendResponse({}); }
});