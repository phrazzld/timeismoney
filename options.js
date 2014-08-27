$(document).ready(function(){

	if(localStorage.using == "salary") {
		$("#salary_form").show();
		$("#annual_option").prop("checked", true);
		$("#wage_form").hide();
	} else {
		$("#wage_form").show();
		$("#salary_form").hide();
	}

	if(localStorage.show_alert == 'yes') {
		$("#alerts").show();
	} else {
		$("#alerts").hide();
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

	function save_salary() {
		var select = document.getElementById("salary");
		if(isNaN(parseFloat(select.value.replace(/\$|,/g, '')))) {
			localStorage.show_alert = 'yes';
		} else {
			localStorage.salary = select.value.replace(/\$|,/g, '');
			localStorage.using = "salary";
			localStorage.show_alert = 'no';
		}
		display_salary = parseFloat(localStorage.salary).toFixed(2).toString();
		$("#salary").attr('placeholder', '$' + display_salary);
	}

	function save_wage() {
		var select = document.getElementById("wage");
		if(isNaN(parseFloat(select.value.replace(/\$/g, '')))) {
			localStorage.show_alert = 'yes';
		} else {
			localStorage.wage = select.value.replace(/\$/g, '');
			localStorage.using = "wage";
			localStorage.show_alert = 'no';
		}
		display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
		$("#wage").attr('placeholder', '$' + display_wage);
	}

});


// taken from http://bit.ly/1ooHsSO
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}







