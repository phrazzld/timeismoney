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

	if(localStorage.auto_convert == "yes") {
		$("#auto_convert").prop("checked", true);
	} else {
		$("#auto_convert").prop("checked", false);
	}

	if(localStorage.show_dollars == "yes") {
		$("#show_dollars").prop("checked", true);
	} else {
		$("#show_dollars").prop("checked", false);
	}

	if(localStorage.convert_weeks == "yes") {
		$("#convert_weeks").prop("checked", true);
	} else {
		$("#convert_weeks").prop("checked", false);
	}

	if(localStorage.adv_view != "show") {
		$("#adv_options_form").hide();
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
		if(localStorage.wage != null) {
			localStorage.using = "wage";
		}
	});

	$("#annual_option").click(function() {
		$("#salary_form").show();
		$("#wage_form").hide();
		if(localStorage.salary != null) {
			localStorage.using = "salary";
		}
	});

	$("#auto_convert").click(function() {
		if(localStorage.auto_convert == "yes") {
			localStorage.auto_convert = "no";
		} else {
			localStorage.auto_convert = "yes";
		}
	});

	$("#show_dollars").click(function() {
		if(localStorage.show_dollars == "yes") {
			localStorage.show_dollars = "no";
		} else {
			localStorage.show_dollars = "yes";
		}
	});

	$("#convert_weeks").click(function() {
		if(localStorage.convert_weeks == "yes") {
			localStorage.convert_weeks = "no";
		} else {
			localStorage.convert_weeks = "yes";
		}
	});

	$("#adv_options").click(function() {
		$("#adv_options_form").toggle("fast");
		if(localStorage.adv_view == "show") {
			localStorage.adv_view = "hide";
		} else {
			localStorage.adv_view = "show";
		}
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







