function save_options() {
	var select = document.getElementById("wage");
	localStorage.wage = select.value;
	alert("Settings saved.");
}

document.querySelector("#save").addEventListener("click", save_options);