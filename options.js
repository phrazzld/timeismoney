var display_wage = parseFloat(localStorage.wage).toFixed(2).toString();

function save_options() {
	var select = document.getElementById("wage");
	if(isNaN(parseFloat(select.value))) {
		alert("What are they paying you in, Trident Layers? \nTry formatting your wage without the currency symbol, like 10.50");
	} else {
		localStorage.wage = select.value;
	}
	display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
	document.getElementById("wage").placeholder = display_wage;
}

document.getElementById("wage").placeholder = display_wage;
document.querySelector("#save").addEventListener("click", save_options);