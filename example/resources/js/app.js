/* app.js - Created By Apptory LTD */
var app = angular.module("exampleApp", ["apAutocomplete"]);

app.controller("mainController", ["$scope", "$http", function($scope, $http) {

	$scope.countries = countries;
	$scope.country = "";

	$scope.autoCompleteConfig = {
		haystack: "countries",
        searchKey: "name",
        onSelect: "onSelect",
        debug: false
	};

	/* Assign the value after user did manual selection */
	$scope.onSelect = function(event) 
	{
		console.log("Selected: ", event.selected);
		$scope.country = event.selected.name;
		$scope.$apply();
	}

}]);


