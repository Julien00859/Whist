// Module principale
var main = angular.module("main", ["whist"]);
// Dépendance du module principale
var whist = angular.module("whist", ["ngSanitize"]);
// Controlleur du module chatIrc
whist.controller("fieldsController", function($scope, $sce, $interval) {
  var socket = io();
  socket.emit("register", prompt("Nickname"));
  socket.on("myerror", function(err) {
    alert(err.msg);
    switch (err.code) {
      case 1:
        socket.emit("register", prompt("Nickname"));
    }
  });
  socket.on("game joined", function(msg) {
    alert("New game started !\n" + msg.cards);
  })
});
