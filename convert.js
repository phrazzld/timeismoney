chrome.runtime.sendMessage({method: "getLocal"}, function(response) {
	var working_wage = response.wage;
	$("body *").replaceText(/^\$[0-9]+(\.[0-9][0-9])?$/, convert);

	// take a monetary string and return it in hours of work
	// very brittle; add error handling for nonmoney values
	function convert(str) {
		var hours = Math.ceil(parseFloat(str.substr(1)) / working_wage);
		return hours.toString() + " hours (" + str + ")";
	}
});

// replaceText jQuery function
(function($){$.fn.replaceText=function(b,a,c){return this.each(function(){var f=this.firstChild,g,e,d=[];if(f){do{if(f.nodeType===3){g=f.nodeValue;e=g.replace(b,a);if(e!==g){if(!c&&/</.test(e)){$(f).before(e);d.push(f)}else{f.nodeValue=e}}}}while(f=f.nextSibling)}d.length&&$(d).remove()})}})(jQuery);