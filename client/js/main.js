// Module principale
var main = angular.module("main", ["chatIrc"]);
// Dépendance du module principale
var chatIrc = angular.module("chatIrc", ["ngSanitize"]);
// Controlleur du module chatIrc
chatIrc.controller("fieldsController", function($scope, $sce, $interval) {
});
