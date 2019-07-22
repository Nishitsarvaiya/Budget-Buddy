// DATA CONTROLLER =============================================================
var dataController = (function() {

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    }

    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    }

    var calculatetotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(currentObj) {
            sum += currentObj.value;
        });
        data.totals[type] = sum;
    }

    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            //  Create new ID
            if (data.allItems[type].length > 0 ) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }


            //  Create new Item based on type 'inc' or 'exp'
            if(type === 'inc'){
                newItem = new Income(ID, des, val);
            } else {
                newItem = new Expense(ID, des, val);
            }

            //  Push the new Item into our Data Structure
            data.allItems[type].push(newItem);

            //  return the new Item
            return newItem;
        },

        deleteItem: function(type, id) {
            var idArr, index;
            idArr = data.allItems[type].map(function(current) {
                return current.id;
            });
            index = idArr.indexOf(id);

            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {
            //  Calculate total incomes and expenses
            calculatetotal('inc');
            calculatetotal('exp');

            //  Calculate the Budget: income - expense
            data.budget = data.totals.inc - data.totals.exp;

            //  Calculate the percentage of income that we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages : function() {
            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(current) {
                return current.getPercentage();
            });
            return allPercentages;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function() {
            console.log(data);
        }
    };
})();


// UI CONTROLLER ===============================================================
var uiController = (function() {

    var DOMStrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__amount",
        inputBtn: ".add__btn",
        incomeContainer: ".income__list",
        expenseContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expenseLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: ".container",
        expensePercLabel: ".item__percentage",
        dateLabel: ".budget__title--month"
    };


    var formatNumber = function(num, type) {
        var numSplit, int, dec;

        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split('.');
        int = numSplit[0];
        dec = numSplit[1];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);
        }
        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMStrings.inputType).value,
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
            };
        },

        getDOMStrings: function () {
            return DOMStrings;
        },

        addListItem: function(obj, type) {
            var htmlString, element;
            //  Create HTML string with placeholder text
            if (type === 'inc') {
                element = DOMStrings.incomeContainer;
                htmlString = `<div class="item clearfix" id="inc-%id%">
                    <div class="item__description">%description%</div>
                    <div class="right clearfix">
                        <div class="item__value">%value%</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`;
            } else {
                element = DOMStrings.expenseContainer;
                htmlString = `<div class="item clearfix" id="exp-%id%">
                    <div class="item__description">%description%</div>
                    <div class="right clearfix">
                        <div class="item__value">%value%</div>
                        <div class="item__percentage">%percentage%</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`;
            }

            //  Replace placeholder text with actual data
            newHtml = htmlString.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            //  Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function(selectorID) {
            var element = document.getElementById(selectorID);
            element.parentNode.removeChild(element);
        },

        displayBudget: function(budgetObj) {
            var type;
            budgetObj.budget >= 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(budgetObj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(budgetObj.totalInc, 'inc');
            document.querySelector(DOMStrings.expenseLabel).textContent = formatNumber(budgetObj.totalExp, 'exp');
            if (budgetObj.percentage > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = budgetObj.percentage + '%';
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = '--';
            }
        },

        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMStrings.expensePercLabel);

            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + "%";
                } else {
                    current.textContent = "--";
                }
            });
        },

        displayDate: function() {
            var month, year, date;
            date = new Date();
            month = date.toLocaleString('en-us', {month: 'long'});
            year = date.getFullYear();
            document.querySelector(DOMStrings.dateLabel).textContent = month + ' ' + year;
        },

        changedType: function() {
            var fields = document.querySelectorAll(
                DOMStrings.inputDescription + ',' +
                DOMStrings.inputValue + ',' +
                DOMStrings.inputType
            );

            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            });

            document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
        },

        clearFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMStrings.inputDescription +', '+ DOMStrings.inputValue);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(current, index, array) {
                current.value = "";
            });
            fieldsArr[0].focus();
        }
    };

})();


// GLOBAL APP CONTROLLER =======================================================
var controller = (function(dataCtrl, uiCtrl) {

    var setupEventListeners = function () {
        var Dom = uiCtrl.getDOMStrings();
        document.querySelector(Dom.inputBtn).addEventListener("click", ctrlAddItem);
        document.addEventListener("keypress", function(event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        document.querySelector(Dom.container).addEventListener("click", ctrlDeleteItem);
        document.querySelector(Dom.inputType).addEventListener('change', uiCtrl.changedType);
    };

    var updateBudget = function() {
        // 1.Calculate Budget
        dataCtrl.calculateBudget();

        // 2.Return Budget
        var budgetObj = dataCtrl.getBudget();

        // 3.Update the Budget on UI
        uiCtrl.displayBudget(budgetObj);
    }

    var updatePercentages = function() {
        // 1. Calculate Percentages
        dataCtrl.calculatePercentages();

        // 2. Read percentages from data controller
        var percentages = dataCtrl.getPercentages();

        // 3. Update the UI with percentages
        uiCtrl.displayPercentages(percentages);
    }

    var ctrlAddItem = function() {
        var input, newItem;
        // 1. Get the input data
        input = uiCtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to the data controller
            newItem = dataCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI
            uiCtrl.addListItem(newItem, input.type);

            // 4. Clear the Fields
            uiCtrl.clearFields();

            // 5. Calculate and Update the budget
            updateBudget();

            // 6. Calculate and Update Percentages
            updatePercentages();

        } else {
            alert("Please enter some values!");
        }
    }

    var ctrlDeleteItem = function(event) {
        var itemID, type, id;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if (itemID) {
            type = itemID.split('-')[0];
            id = parseInt(itemID.split('-')[1]);
        }

        // 1.Delete the Item from Data Structure
        dataCtrl.deleteItem(type, id);

        // 2.Delete the Item from UI
        uiCtrl.deleteListItem(itemID);

        // 3.Calculate & Update the Budget
        updateBudget();

        // 4. Calculate and Update Percentages
        updatePercentages();

    }

    return {
        init: function () {
            console.log("Application Initialized");
            uiCtrl.displayDate();
            uiCtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    };
})(dataController, uiController);

// Initialize the App ========================================================
controller.init();
