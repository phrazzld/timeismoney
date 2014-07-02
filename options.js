var display_wage = parseFloat(localStorage.wage).toFixed(2).toString();

function save_wage() {
	var select = document.getElementById("wage");
	if(isNaN(parseFloat(select.value.replace(/\$/g, '')))) {
		alert("What are they paying you in, Trident Layers? \nTry entering your wage in standard USD format, like $10.50");
	} else {
		localStorage.wage = select.value.replace(/\$/g, '');
	}
	display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
	document.getElementById("wage").placeholder = "$" + display_wage;
}

// function save_ignore_sites()

// function quit_ignoring_this_site(str)

// populate div#ignored_sites

if(isNaN(display_wage)) {
	document.getElementById("wage").placeholder = "Enter your hourly wage"
} else {
	document.getElementById("wage").placeholder = "$" + display_wage;
}

function prompt_donation() {
		confirm("Copy my wallet address: \n11MythGvuWjwMiYBmuViWLSXKi5oVR1pa");
}

document.querySelector("#save_wage").addEventListener("click", save_wage);
document.querySelector("#donate_btc").addEventListener("click", prompt_donation);
// document.querySelector(".stop_ignoring_this_site").addEventListener("click", quit_ignoring_this_site);