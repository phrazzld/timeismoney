$(document).ready(function(){
	chrome.runtime.sendMessage({method: "getLocal"}, function(response) {

			if(response.auto_convert == "yes") {				
				if(response.using == "wage") {
					var working_wage = response.wage;
					if(!isNaN(working_wage)) {
						if(response.currency == "USD") {
							$("body *").replaceText(/^((\$|USD)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						} else if(response.currency == "EUR") {
							$("body *").replaceText(/^((\€|EUR)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						} else if(response.currency == "GBP") {
							$("body *").replaceText(/^((\£|GBP)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						} else {
							$("body *").replaceText(/^((\$|CDN|CAD|C)(\s{0,2}?)((\$|CDN|CAD|C)?)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						}
					}

				} else if(response.using == "salary") {
					var working_wage = response.salary;
					working_wage = working_wage/52/40;
					if(!isNaN(working_wage)) {
						if(response.currency == "USD") {
							$("body *").replaceText(/^((\$|USD)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						} else if(response.currency == "EUR") {
							$("body *").replaceText(/^((\€|EUR)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						} else if(response.currency == "GBP") {
							$("body *").replaceText(/^((\£|GBP)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						} else {
							$("body *").replaceText(/^((\$|CDN|CAD|C)(\s{0,2}?)((\$|CDN|CAD|C)?)(\s{0,3}?)([0-9]([0-9,])*)((\.|\,)\d{2})?|([0-9]([0-9,]))((\.|\,)\d{2})?([pcm]|bn| [mb]illion))$/, convert);
						}
					}
				}
			}

			function convert(str) {
				new_str = str.trim();
				new_str = new_str.replace(/\,(\d\d)$/g, '.$1')
				new_str = new_str.replace(/[^\d.]/g, '');
				var time = parseFloat(new_str) / working_wage;
				if(isNaN(time)) { return str; }
				var hours = Math.floor(time);
				var minutes = Math.ceil(60 * (time - hours));
				if(minutes == 60) { hours += 1; minutes = 0; }
				if(response.show_dollars == "yes") {
					var msg = str + " (";
				} else {
					var msg = " ";
				}

				if(response.convert_weeks == "yes") {
					var weeks = Math.floor(hours / 40);
					if(weeks > 0) {
						hours = Math.ceil(hours - weeks * 40);
						minutes = 0;
					}
					if(weeks == 0) { }
					else if(weeks == 1) {
						msg += weeks.toString() + " wk";
					} else {
						msg += weeks.toString() + " wks";
					}
					if(hours != 0) { msg += " "; }
				}

				if(hours == 0) { } 
				else if(hours == 1) {
					msg += hours.toString() + " hr";
				} else {
					msg += hours.toString() + " hrs";
				}
				if(minutes != 0) { msg += " "; }

				if(minutes == 0) { }
				else if(minutes == 1) {
					msg += minutes + " min";
				} else {
					msg += minutes + " mins";
				}

				if(response.show_dollars == "yes") {
					msg += ") ";
				} else {
					msg += " ";
				}

				return msg;
			}

		});
		// replaceText jQuery function
		(function($){$.fn.replaceText=function(b,a,c){return this.each(function(){var f=this.firstChild,g,e,d=[];if(f){do{if(f.nodeType===3){g=f.nodeValue;e=g.replace(b,a);if(e!==g){if(!c&&/</.test(e)){$(f).before(e);d.push(f)}else{f.nodeValue=e}}}}while(f=f.nextSibling)}d.length&&$(d).remove()})}})(jQuery);
});
	