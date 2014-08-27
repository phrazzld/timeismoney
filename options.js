$(document).ready(function(){

	if(localStorage.using == "salary") {
		$("#salary_form").show();
		$("#annual_option").prop("checked", true);
		$("#wage_form").hide();
	} else {
		$("#wage_form").show();
		$("#salary_form").hide();
	}

	var display_salary = parseFloat(localStorage.salary).toFixed(2).toString();
	if(isNaN(display_salary)) {
		$("#salary").attr('placeholder', 'Enter your annual income');
	} else {
		$("#salary").attr('placeholder', '$' + numberWithCommas(display_salary))
	}

	var display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
	if(isNaN(display_wage)) {
		$("#wage").attr('placeholder', 'Enter your hourly wage');
	} else {
		$("#wage").attr('placeholder', '$' + display_wage);
	}

	$("#hourly_option").click(function() {
		$("#wage_form").show();
		$("#salary_form").hide();
	});

	$("#annual_option").click(function() {
		$("#salary_form").show();
		$("#wage_form").hide();
	});

	$("#save_wage").click(save_wage);
	$("#save_salary").click(save_salary);

});


function save_salary() {
	var select = document.getElementById("salary");
	if(isNaN(parseFloat(select.value.replace(/\$|,/g, '')))) {
		alert("What are they paying you in, Trident Layers? \nTry entering your salary in standard USD format, like $30,000.00")
	} else {
		localStorage.salary = select.value.replace(/\$|,/g, '');
		localStorage.using = "salary";
	}
	display_salary = parseFloat(localStorage.salary).toFixed(2).toString();
	document.getElementById("salary").placeholder = "$" + display_salary;
}

function save_wage() {
	var select = document.getElementById("wage");
	if(isNaN(parseFloat(select.value.replace(/\$/g, '')))) {
		// make this alert appear within the extension, rather than as a JS alert
		alert("What are they paying you in, Trident Layers? \nTry entering your wage in standard USD format, like $10.50");
	} else {
		localStorage.wage = select.value.replace(/\$/g, '');
		localStorage.using = "wage";
	}
	display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
	document.getElementById("wage").placeholder = "$" + display_wage;
}

// taken from http://bit.ly/1ooHsSO
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}







