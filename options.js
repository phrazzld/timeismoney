function save_options() {
	var select = document.getElementById("wage");
	if(isNaN(parseFloat(select.value))) {
		alert("What are they paying you in, Trident Layers? \nTry formatting your wage without the currency symbol, like 10.50");
	} else {
		localStorage.wage = select.value;
		alert("Settings saved.");
	}
}

document.querySelector("#save").addEventListener("click", save_options);