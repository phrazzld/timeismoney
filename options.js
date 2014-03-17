function save_options() {
	var select = document.getElementById("wage");
	localStorage.wage = select.value;
	alert("localStorage.wage is " + localStorage.wage);
	alert("Options saved");
}

document.querySelector("#save").addEventListener("click", save_options);