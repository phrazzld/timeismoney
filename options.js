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

	if(localStorage.currency != "EUR" && localStorage.currency != "GBP" && localStorage.currency != "CAD") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='USD']").attr("selected", "selected");
		localStorage.currency = "USD";
		$("input#expense_cost").attr("placeholder", "$ 2.00")
	} else if(localStorage.currency == "EUR") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='EUR']").attr("selected", "selected");
		localStorage.currency = "EUR";
		$("input#expense_cost").attr("placeholder", "\u20AC 2.00")
	} else if(localStorage.currency == "GBP") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='GBP']").attr("selected", "selected");
		localStorage.currency = "GBP";
		$("input#expense_cost").attr("placeholder", "\u00A3 2.00")
	} else {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='CAD']").attr("selected", "selected");
		localStorage.currency = "CAD";
		$("input#expense_cost").attr("placeholder", "$ 2.00")
	}

	gen_expenses_html();

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

	if(localStorage.show_expenses != "show") {
		$("#expenses_form").hide();
	}

	var display_salary = parseFloat(localStorage.salary).toFixed(2).toString();
	if(isNaN(display_salary)) {
		$("#salary").attr('placeholder', 'Enter your annual income');
	} else {
		if(localStorage.currency == "USD" || localStorage.currency == "CAD") {
			$("#salary").attr("placeholder", "$ " + numberWithCommas(display_salary));
		} else if(localStorage.currency == "EUR") {
			$("#salary").attr("placeholder", "\u20AC " + numberWithCommas(display_salary));
		} else {
			$("#salary").attr("placeholder", "\u00A3 " + numberWithCommas(display_salary));
		}
	}

	var display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
	if(isNaN(display_wage)) {
		$("#wage").attr('placeholder', 'Enter your hourly wage');
	} else {
		if(localStorage.currency == "USD" || localStorage.currency == "CAD") {
			$("#wage").attr('placeholder', "$ " + display_wage);
		} else if(localStorage.currency == "EUR") {
			$("#wage").attr("placeholder", "\u20AC " + display_wage);
		} else {
			$("#wage").attr("placeholder", "\u00A3 " + display_wage);
		}
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

	$("#expenses_header").click(function() {
		$("#expenses_form").toggle("fast");
		if(localStorage.show_expenses == "show") {
			localStorage.show_expenses = "hide";
		} else {
			localStorage.show_expenses = "show";
		}
	});

	$("select#currency").change(function() {
		var optionSelected = $("option:selected", this);
		localStorage.currency = optionSelected.data("curr");
	});

	$("#save_wage").click(save_wage);
	$("#save_salary").click(save_salary);
	$("#save_expense").click(save_expense);

	function save_salary() {
		var select = document.getElementById("salary");
		if(select.value != "") {
			if(isNaN(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')))) {
				localStorage.show_alert = 'yes';
			} else if(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')) == '') {
			} else {
				localStorage.salary = select.value.replace(/(\$|,|€|£| +?)/g, '');
				localStorage.using = "salary";
				localStorage.show_alert = 'no';
				display_salary = parseFloat(localStorage.salary).toFixed(2).toString();
				if(localStorage.currency == "USD" || localStorage.currency == "CAD") {
					$("#salary").attr("placeholder", "$ " + display_salary);
				} else if(localStorage.currency == "EUR") {
					$("#salary").attr("placeholder", "€" + display_salary);
				} else {
					$("#salary").attr("placeholder", "£" + display_salary);
				}
			}
		}
	}

	function save_wage() {
		var select = document.getElementById("wage");
		if(select.value != "") {
			if(isNaN(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')))) {
				localStorage.show_alert = 'yes';
			} else if(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')) == '') {
			} else {
				localStorage.wage = select.value.replace(/(\$|,|€|£| +?)/g, '');
				localStorage.using = "wage";
				localStorage.show_alert = 'no';
				display_wage = parseFloat(localStorage.wage).toFixed(2).toString();
				if(localStorage.currency == "USD" || localStorage.currency == "CAD") {
					$("#wage").attr("placeholder", "$ " + display_wage);
				} else if(localStorage.currency == "EUR") {
					$("#wage").attr("placeholder", "€" + display_wage);
				} else {
					$("#wage").attr("placeholder", "£" + display_wage);
				}
			}
		}
	}

	function save_expense() {
		if(localStorage.expenses == undefined) {
			var x = {};
		} else {
			var x = JSON.parse(localStorage.expenses);
		}
		
		var c = document.getElementById("expense_cost").value.replace(/(\$|,|€|£| +?)/g, '');
		var n = document.getElementById("expense_name").value;
		var f = document.getElementById("expense_frequency").value;

		if(isNaN(parseFloat(c))) {
			localStorage.show_alert = 'yes';
		} else if(parseFloat(c) == '') {
		} else {
			x[n] = { cost: c, frequency: f };
			x = JSON.stringify(x);
			localStorage.expenses = x;	
		}
	}

	function create_html(html_str) {
		var frag = document.createDocumentFragment(),
			temp = document.createElement("div");
		temp.innerHTML = html_str;
		while(temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	}

	function gen_expenses_html() {
		if(localStorage.expenses != undefined) {
			var expenses = JSON.parse(localStorage.expenses);
			var total_expenses = 0;
			if(localStorage.currency == "USD" || localStorage.currency == "CAD") {
				var currency_used = "$ ";
			} else if(localStorage.currency == "EUR") {
				var currency_used = "€ ";
			} else {
				var currency_used = "£ ";
			}
			for(var expense in expenses) {
				if(expenses.hasOwnProperty(expense) && typeof(expenses[expense]) == "object") {
					var cost = currency_used + parseFloat(expenses[expense].cost).toFixed(2).toString();
					var frequency = expenses[expense].frequency;
					var html = create_html('<div class="recurring_expense" id="recurring_expense_' + expense.toString() + '"><span class="recurring_expense_cost">' + cost + '</span> <span class="recurring_expense_frequency">' + frequency + '</span> on <span class="recurring_expense_name">' + expense.toString() + '</span> <span class="recurring_expense_delete"><a class="delete_expense" href="javascript:;">delete</a> </span></div>');
					document.getElementById("current_expenses").appendChild(html);
					if(expenses[expense].frequency == "daily") {
						total_expenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, '')) * 30;
					} else if(expenses[expense].frequency == "weekly") {
						total_expenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, '')) * 4;
					} else if(expenses[expense].frequency == "monthly") {
						total_expenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, ''));
					} else if(expenses[expense].frequency == "annually") {
						total_expenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, '')) / 12;
					}
				}
			}
			var total_expenses_html = create_html('<div id="total_expenses">' + currency_used + total_expenses.toFixed(2).toString() + ' total per month</div>');
			document.getElementById("current_expenses").appendChild(total_expenses_html);
			localStorage["total_expenses"] = total_expenses;
		}
	}

	$(".delete_expense").click(function() {
		var id = $(this).closest("div").attr("id");
		id = id.replace("recurring_expense_", "");
		alert(id);
		var expenses = JSON.parse(localStorage["expenses"]);
		delete expenses[id];
		expenses = JSON.stringify(expenses);
		localStorage["expenses"] = expenses;
		location.reload();
	});

	function removeExpense(expenseID) {
		var expense = document.getElementById(expenseID);
		expense = expense.replace("recurring_expense_", "");
		var expenses = JSON.parse(localStorage["expenses"]);
		delete expenses[expense];
		expenses = JSON.stringify(expenses);
		localStorage["expenses"] = expenses;
	}

});


// taken from http://bit.ly/1ooHsSO
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}





