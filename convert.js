chrome.runtime.sendMessage({method: "getLocal"}, function(response) {
	var working_wage = response.wage;
	if(isNaN(working_wage)) {
		working_wage = 7.50;
	}
	// \s*\$[0-9]+(\.[0-9][0-9])?$
	// /^\$[0-9]+(\.[0-9][0-9])?$/
	$("body *").replaceText(/^\s*\$[0-9]+(\.[0-9][0-9])?$/, convert);

	// take a monetary string and return it in hours of work
	function convert(str) {
		// get the times right
		str = str.trim();
		var time = parseFloat(str.substr(1)) / working_wage;
		var hours = Math.floor(time);
		var minutes = Math.ceil(60 * (time - hours));

		// add hours to msg
		if(hours == 0) {
			msg = "";
		} else if(hours == 1) {
			msg = hours.toString() + " hr";
		} else {
			msg = hours.toString() + " hrs";
		}
		// add minutes to msg
		if(minutes == 1) {
			msg = msg + " " + minutes + " min (" + str + ")";
		} else if(minutes == 0) {
			msg = msg + " (" + str + ")";
		} else {
			msg = msg + " " + minutes + " mins (" + str + ")";
		}
		// send msg back to replaceText fcn
		return msg;
	}

});

// replaceText jQuery function
(function($){$.fn.replaceText=function(b,a,c){return this.each(function(){var f=this.firstChild,g,e,d=[];if(f){do{if(f.nodeType===3){g=f.nodeValue;e=g.replace(b,a);if(e!==g){if(!c&&/</.test(e)){$(f).before(e);d.push(f)}else{f.nodeValue=e}}}}while(f=f.nextSibling)}d.length&&$(d).remove()})}})(jQuery);