$(document).ready(function(){

	if(localStorage.using == "salary") {
		$("#salary-form").show();
		$("#annual-option").prop("checked", true);
		$("#wage-form").hide();
	} else {
		$("#wage-form").show();
		$("#salary-form").hide();
	}

	if(localStorage.show_alert == 'yes') {
		$("#alerts").show();
	} else {
		$("#alerts").hide();
	}

	if(localStorage.currency != "EUR" && localStorage.currency != "GBP" && localStorage.currency != "CAD" && localStorage.currency != "AUD") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='USD']").attr("selected", "selected");
		localStorage.currency = "USD";
		$("input#expense-cost").attr("placeholder", "$ 2.00")
	} else if(localStorage.currency == "EUR") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='EUR']").attr("selected", "selected");
		localStorage.currency = "EUR";
		$("input#expense-cost").attr("placeholder", "\u20AC 2.00")
	} else if(localStorage.currency == "GBP") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='GBP']").attr("selected", "selected");
		localStorage.currency = "GBP";
		$("input#expense-cost").attr("placeholder", "\u00A3 2.00")
	} else if(localStorage.currency == "CAD") {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='CAD']").attr("selected", "selected");
		localStorage.currency = "CAD";
		$("input#expense-cost").attr("placeholder", "$ 2.00")
	} else {
		$("select#currency option:selected").attr("selected", null);
		$("select#currency option[value='AUD']").attr("selected", "selected");
		localStorage.currency = "AUD";
		$("input#expense-cost").attr("placeholder", "$ 2.00")
	}

	genExpensesHtml();

	if(localStorage.autoConvert == undefined) {
		localStorage.autoConvert = "yes";
	}

	if(localStorage.showDollars == undefined) {
		localStorage.showDollars = "yes";
	}

	if(localStorage.convertWeeks == undefined) {
		localStorage.convertWeeks = "yes";
	}

	if(localStorage.autoConvert == "no") {
		$("#auto-convert").prop("checked", false);
	} else {
		$("#auto-convert").prop("checked", true);
	}

	if(localStorage.showDollars == "no") {
		$("#show-dollars").prop("checked", false);
	} else {
		$("#show-dollars").prop("checked", true);
	}

	if(localStorage.convertWeeks == "no") {
		$("#convert-weeks").prop("checked", false);
	} else {
		$("#convert-weeks").prop("checked", true);
	}

	if(localStorage.advView != "show") {
		$("#adv-options-form").hide();
	}

	if(localStorage.showExpenses != "show") {
		$("#expenses-form").hide();
	}

	var displaySalary = parseFloat(localStorage.salary).toFixed(2).toString();
	if(isNaN(displaySalary)) {
		$("#salary").attr('placeholder', 'Enter your annual income');
	} else {
		if(localStorage.currency == "USD" || localStorage.currency == "CAD" || localStorage.currency == "AUD") {
			$("#salary").attr("placeholder", "$ " + numberWithCommas(displaySalary));
		} else if(localStorage.currency == "EUR") {
			$("#salary").attr("placeholder", "\u20AC " + numberWithCommas(displaySalary));
		} else {
			$("#salary").attr("placeholder", "\u00A3 " + numberWithCommas(displaySalary));
		}
	}

	var displayWage = parseFloat(localStorage.wage).toFixed(2).toString();
	if(isNaN(displayWage)) {
		$("#wage").attr('placeholder', 'Enter your hourly wage');
	} else {
		if(localStorage.currency == "USD" || localStorage.currency == "CAD" || localStorage.currency == "AUD") {
			$("#wage").attr('placeholder', "$ " + displayWage);
		} else if(localStorage.currency == "EUR") {
			$("#wage").attr("placeholder", "\u20AC " + displayWage);
		} else {
			$("#wage").attr("placeholder", "\u00A3 " + displayWage);
		}
	}

	$("#hourly-option").click(function() {
		$("#wage-form").show();
		$("#salary-form").hide();
		if(localStorage.wage != null) {
			localStorage.using = "wage";
		}
	});

	$("#annual-option").click(function() {
		$("#salary-form").show();
		$("#wage-form").hide();
		if(localStorage.salary != null) {
			localStorage.using = "salary";
		}
	});

	$("#auto-convert").click(function() {
		if(localStorage.autoConvert == "yes") {
			localStorage.autoConvert = "no";
		} else {
			localStorage.autoConvert = "yes";
		}
	});

	$("#show-dollars").click(function() {
		if(localStorage.showDollars == "yes") {
			localStorage.showDollars = "no";
		} else {
			localStorage.showDollars = "yes";
		}
	});

	$("#convert-weeks").click(function() {
		if(localStorage.convertWeeks == "yes") {
			localStorage.convertWeeks = "no";
		} else {
			localStorage.convertWeeks = "yes";
		}
	});

	$("#adv-options").click(function() {
		$("#adv-options-form").toggle("fast");
		if(localStorage.advView == "show") {
			localStorage.advView = "hide";
		} else {
			localStorage.advView = "show";
		}
	});

	$("#expenses-header").click(function() {
		$("#expenses-form").toggle("fast");
		if(localStorage.showExpenses == "show") {
			localStorage.showExpenses = "hide";
		} else {
			localStorage.showExpenses = "show";
		}
	});

	$("select#currency").change(function() {
		var optionSelected = $("option:selected", this);
		localStorage.currency = optionSelected.data("curr");
	});

	$("#save-wage").click(saveWage);
	$("#save-salary").click(saveSalary);
	$("#save-expense").click(saveExpense);

	var donateButton = $("#donate-button");
	donateButton.on("click", function() {
		donateButton.hide();
		$("#wallet-address").show();
	});

	function saveSalary() {
		var select = document.getElementById("salary");
		if(select.value != "") {
			if(isNaN(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')))) {
				localStorage.showAlert = 'yes';
			} else if(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')) == '') {
			} else {
				localStorage.salary = select.value.replace(/(\$|,|€|£| +?)/g, '');
				localStorage.using = "salary";
				localStorage.showAlert = 'no';
				displaySalary = parseFloat(localStorage.salary).toFixed(2).toString();
				if(localStorage.currency == "USD" || localStorage.currency == "CAD" || localStorage.currency == "AUD") {
					$("#salary").attr("placeholder", "$ " + displaySalary);
				} else if(localStorage.currency == "EUR") {
					$("#salary").attr("placeholder", "€ " + displaySalary);
				} else {
					$("#salary").attr("placeholder", "£ " + displaySalary);
				}
			}
		}
	}

	function saveWage() {
		var select = document.getElementById("wage");
		if(select.value != "") {
			if(isNaN(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')))) {
				localStorage.showAlert = 'yes';
			} else if(parseFloat(select.value.replace(/(\$|,|€|£| +?)/g, '')) == '') {
			} else {
				localStorage.wage = select.value.replace(/(\$|,|€|£| +?)/g, '');
				localStorage.using = "wage";
				localStorage.showAlert = 'no';
				displayWage = parseFloat(localStorage.wage).toFixed(2).toString();
				if(localStorage.currency == "USD" || localStorage.currency == "CAD" || localStorage.currency == "AUD") {
					$("#wage").attr("placeholder", "$ " + displayWage);
				} else if(localStorage.currency == "EUR") {
					$("#wage").attr("placeholder", "€ " + displayWage);
				} else {
					$("#wage").attr("placeholder", "£ " + displayWage);
				}
			}
		}
	}

	function saveExpense() {
		if(localStorage.expenses == undefined) {
			var x = {};
		} else {
			var x = JSON.parse(localStorage.expenses);
		}
		
		var c = document.getElementById("expense-cost").value.replace(/(\$|,|€|£| +?)/g, '');
		var n = document.getElementById("expense-name").value;
		var f = document.getElementById("expense-frequency").value;

		if(isNaN(parseFloat(c))) {
			localStorage.showAlert = 'yes';
		} else if(parseFloat(c) == '') {
		} else {
			x[n] = { cost: c, frequency: f };
			x = JSON.stringify(x);
			localStorage.expenses = x;	
		}
	}

	function createHtml(htmlStr) {
		var frag = document.createDocumentFragment(),
			temp = document.createElement("div");
		temp.innerHtml = htmlStr;
		while(temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	}

	function genExpensesHtml() {
		if(localStorage.expenses != undefined) {
			var expenses = JSON.parse(localStorage.expenses);
			var totalExpenses = 0;
			if(localStorage.currency == "USD" || localStorage.currency == "CAD" || localStorage.currency == "AUD") {
				var currencyUsed = "$ ";
			} else if(localStorage.currency == "EUR") {
				var currencyUsed = "€ ";
			} else {
				var currencyUsed = "£ ";
			}
			for(var expense in expenses) {
				if(expenses.hasOwnProperty(expense) && typeof(expenses[expense]) == "object") {
					var cost = currencyUsed + parseFloat(expenses[expense].cost).toFixed(2).toString();
					var frequency = expenses[expense].frequency;
					var html = createHtml('<div class="recurring-expense" id="recurring-expense-' + expense.toString() + '"><span class="recurring-expense-cost">' + cost + '</span> <span class="recurring-expense-frequency">' + frequency + ' on </span><span class="recurring-expense-name">' + expense.toString() + '</span> <span class="recurring-expense-delete"><a class="delete-expense" href="javascript:;">delete</a> </span></div>');
					document.getElementById("current-expenses").appendChild(html);
					if(expenses[expense].frequency == "daily") {
						totalExpenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, '')) * 30;
					} else if(expenses[expense].frequency == "weekly") {
						totalExpenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, '')) * 4;
					} else if(expenses[expense].frequency == "monthly") {
						totalExpenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, ''));
					} else if(expenses[expense].frequency == "annually") {
						totalExpenses += parseFloat(cost.replace(/(\$|,|€|£| +?)/g, '')) / 12;
					}
				}
			}
			var totalExpensesHtml = createHtml('<div id="total-expenses">' + currencyUsed + totalExpenses.toFixed(2).toString() + ' total per month</div>');
			document.getElementById("current-expenses").appendChild(totalExpensesHtml);
			localStorage["totalExpenses"] = totalExpenses;
		}
	}

	$(".delete-expense").click(function() {
		var id = $(this).closest("div").attr("id");
		id = id.replace("recurring-expense-", "");
		var expenses = JSON.parse(localStorage["expenses"]);
		delete expenses[id];
		expenses = JSON.stringify(expenses);
		localStorage["expenses"] = expenses;
		location.reload();
	});

	function removeExpense(expenseId) {
		var expense = document.getElementById(expenseId);
		expense = expense.replace("recurring-expense-", "");
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





