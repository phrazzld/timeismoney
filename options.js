var display_wage = parseFloat(localStorage.wage).toFixed(2).toString();

function save_options() {
	// replace(/\$/g, '')
	var select = document.getElementById("wage");
	if(isNaN(parseFloat(select.value.replace(/\$/g, '')))) {
		alert("What are they paying you in, Trident Layers? \nTry entering your wage in standard USD format, like $10.50");
	} else {
		localStorage.wage = select.value.replace(/\$/g, '');
	}
	display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
	document.getElementById("wage").placeholder = "$" + display_wage;
}

if(isNaN(display_wage)) {
	document.getElementById("wage").placeholder = "Enter your hourly wage"
} else {
	document.getElementById("wage").placeholder = "$" + display_wage;
}

document.querySelector("#save").addEventListener("click", save_options);