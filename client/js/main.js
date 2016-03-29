// Module principale

angular.module("main", []).controller("fieldsController", function($scope, $sce, $interval, $timeout) {
  this.socket = io();

  this.me = {
    nickname: "",
    nicknameValidated: false,
    cards: []
  }

  this.game = {
    started: false,
    trump: "",
    players: [],
    currentFold: new Cards([]),
    currentPlayer: ""
  }

  this.players = {
    // playerX: {
    //   nickname: "",
    //   announce: "",
    //   myFriend: "",
    //   cards: 13,
    //   folds: "",
    //   lastFold: Cards(),
    //   side: "left/top/right/bottom"
    // }
  }

  this.message = [
    // {
    //   sender: "",
    //   time: new Date(),
    //   msg: ""
    // }
  ];

  this.symbols = symbols.slice();

  this.needSymbolForm = function needSymbolForm(announce) {
    return _.contains(["Solo", "Emballage", "Abondance"], announce);
  }

  this.register = function register() {
    $scope.ctrl.socket.emit("register", this.me.nickname);
  }

  this.sendChatMessage = function sendChatMessage() {
    if ($scope.ctrl.chatMessage.trim().length > 0) {
      $scope.ctrl.socket.emit("chat message", $scope.ctrl.chatMessage.trim());
      $scope.ctrl.chatMessage = "";
    }
  }

  this.sendAnnounce = function sendAnnounce() {
    if (_.contains($scope.ctrl.availableAnnounces, $scope.ctrl.selectedAnnounce)) {
      if ($scope.ctrl.needSymbolForm($scope.ctrl.selectedAnnounce) && _.contains($scope.ctrl.symbols, $scope.ctrl.selectedSymbol))
        $scope.ctrl.socket.emit("game announce", $scope.ctrl.selectedAnnounce, $scope.ctrl.selectedSymbol);
      else $scope.ctrl.socket.emit("game announce", $scope.ctrl.selectedAnnounce);
    }
  }

  this.socket.on("nickname validation", function(nickname){
    $scope.ctrl.me.nickname = nickname;
    $scope.ctrl.me.nicknameValidated = true;
    $scope.$apply();
  });

  this.socket.on("waiting room joined", function(players){
    $scope.ctrl.game.players = players;
    $scope.$apply();
  });

  this.socket.on("waiting room joined by", function(nickname){
    if ($scope.ctrl.game.players.length < 4) $scope.ctrl.game.players.push(nickname);
    $scope.$apply();
  });

  this.socket.on("chat message", function(rawMsg){
    $scope.ctrl.message.push({sender: rawMsg.sender, time: rawMsg.time, msg: rawMsg.msg});
    $scope.$apply();
  });

  this.socket.on("myerror", function(err) {
    alert(err.msg);
    switch (err.code) {
      case 1:
        socket.emit("register", prompt("Nickname"));
    }
  });

  this.socket.on("game joined", function(rawMsg) {
    $scope.ctrl.newNormalGame(rawMsg);
  });

  this.newNormalGame = function newNormalGame(rawMsg) {
    if ($scope.ctrl.me.nicknameValidated) {
      $scope.ctrl.me.cards = new Cards(getCardsFromString(rawMsg.cards));
      $scope.ctrl.game.players = rawMsg.players;

      for (var i in $scope.ctrl.game.players) {
        $scope.ctrl.players[$scope.ctrl.game.players[i]] = {
          nickname: $scope.ctrl.game.players[i],
          announce: undefined,
          myFriend: undefined,
          cards: 13,
          folds: 0,
          lastFold: undefined,
          // Je serai toujours en bas, les autres me suivront dans l'ordre horlogique
          side: ["bottom","left","top","right"][($scope.ctrl.game.players.indexOf($scope.ctrl.game.players[i]) - $scope.ctrl.game.players.indexOf($scope.ctrl.me.nickname) + 4) % 4]
        }
      }
      $scope.ctrl.game.started = true;
      $scope.$apply();
    } else {
      // Tant que le nom n'a pas été validé, on met en attente le lancement de la partie
      $timeout($scope.ctrl.newNormalGame, 100, false, rawMsg);
    }
  }

  this.socket.on("next turn", function(rawMsg){
    $scope.ctrl.game.currentPlayer = rawMsg.currentPlayer;
    $scope.ctrl.game.state = rawMsg.state;

    if ($scope.ctrl.game.currentPlayer == $scope.ctrl.me.nickname) {
      switch (rawMsg.state) {
        case 1:
          $scope.ctrl.availableAnnounces = rawMsg.availableAnnounces;
          break;
        default:

      }
    }
    $scope.$apply();
  });

  this.socket.on("game announce", function(ann, sym){console.log(ann, sym)});
});
