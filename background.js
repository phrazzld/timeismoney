chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if(request.method == "getLocal"){
		sendResponse({showExpenses: localStorage["showExpenses"],
					  totalExpenses: localStorage["totalExpenses"],
					  expenses: localStorage["expenses"],
					  currency: localStorage["currency"],
					  showAlert: localStorage["showAlert"],
					  using: localStorage["using"],
					  autoConvert: localStorage["autoConvert"],
					  showDollars: localStorage["showDollars"],
					  convertWeeks: localStorage["convertWeeks"],
					  advView: localStorage["advView"],
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


function installNotice() {
    if (localStorage.getItem('installTime'))
        return;

    var now = new Date().getTime();
    localStorage.setItem('installTime', now);
    chrome.tabs.create({url: "options.html"});
}
installNotice();