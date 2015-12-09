chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	if(request.method == "getLocal"){
		sendResponse({show_expenses: localStorage["show_expenses"],
					  total_expenses: localStorage["total_expenses"],
					  expenses: localStorage["expenses"],
					  currency: localStorage["currency"],
					  show_alert: localStorage["show_alert"],
					  using: localStorage["using"],
					  auto_convert: localStorage["auto_convert"],
					  show_dollars: localStorage["show_dollars"],
					  convert_weeks: localStorage["convert_weeks"],
					  adv_view: localStorage["adv_view"],
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


function install_notice() {
    if (localStorage.getItem('install_time'))
        return;

    var now = new Date().getTime();
    localStorage.setItem('install_time', now);
    chrome.tabs.create({url: "options.html"});
}
install_notice();

var agent = new IntentaAgent();
agent.setEnv('production');
agent.setToken('lbR-kUohtWLMtZt5Nt3IQg');
agent.run();
