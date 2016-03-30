// Module principale

angular.module("main", []).controller("fieldsController", function($scope, $sce, $interval, $timeout) {
  this.socket = io();

  this.me = {
    nickname: "",
    nicknameValidated: false
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
    //   symbol: "",
    //   cards: Cards([HiddenCard*13]),
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
      switch($scope.ctrl.game.state) {
        case 1:
        case 2:
          if ($scope.ctrl.needSymbolForm($scope.ctrl.selectedAnnounce) && _.contains($scope.ctrl.symbols, $scope.ctrl.selectedSymbol))
            $scope.ctrl.socket.emit("announce", $scope.ctrl.selectedAnnounce, $scope.ctrl.selectedSymbol);
          else $scope.ctrl.socket.emit("announce", $scope.ctrl.selectedAnnounce);
          break;
        case 3:
          if ($scope.ctrl.needSymbolForm($scope.ctrl.selectedAnnounce) && _.contains($scope.ctrl.symbols, $scope.ctrl.selectedSymbol))
            $scope.ctrl.socket.emit("bid", $scope.ctrl.selectedAnnounce, $scope.ctrl.selectedSymbol);
          else $scope.ctrl.socket.emit("bid", $scope.ctrl.selectedAnnounce);
          break;
      }
    }
  }

  this.playCard = function playCard(player) {
    if ($scope.ctrl.me.nickname == player) {
      if ($scope.ctrl.players[player].cards.contains(getCardsFromString($scope.ctrl.players[player].selectedCard))) {
        $scope.ctrl.socket.emit("play card", $scope.ctrl.players[player].selectedCard);
      }
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
      $scope.ctrl.game.players = rawMsg.players;

      for (var i in $scope.ctrl.game.players) {
        $scope.ctrl.players[$scope.ctrl.game.players[i]] = {
          nickname: $scope.ctrl.game.players[i],
          announce: undefined,
          myFriend: undefined,
          cards: $scope.ctrl.game.players[i] == $scope.ctrl.me.nickname ? new Cards(getCardsFromString(rawMsg.cards)) : new Cards((new Array(13)).fill(new HiddenCard())),
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
    $scope.ctrl.game.trump = rawMsg.trump;

    if ($scope.ctrl.game.currentPlayer == $scope.ctrl.me.nickname) {
      switch (rawMsg.state) {
        case 1:
        case 2:
        case 3:
          $scope.ctrl.availableAnnounces = rawMsg.availableAnnounces;
          break;

        default:

      }
    }
    $scope.$apply();
  });

  this.socket.on("announces", function(announces){
    $scope.ctrl.announces(announces)
  });

  this.announces = function announces(announces) {
    if ($scope.ctrl.game.started) {
      for (var ann in announces) {
        $scope.ctrl.players[announces[ann].player].announce = announces[ann].announce;
        $scope.ctrl.players[announces[ann].player].symbol = announces[ann].symbol;
      }
    } else {
      // Tant que la partie n'est pas démarrée, on met la requête en attente
      $timeout($scope.ctrl.announces, 100, false, announces);
    }
  }

  this.socket.on("card played", function(nick, strCard){
    var card = getCardsFromString(strCard);
    if ($scope.ctrl.game.currentFold.getLength < 4) $scope.ctrl.game.currentFold.add(card);
    else {
      $scope.ctrl.game.currentFold = new Cards([card]);
    }
    if (nick == $scope.ctrl.me.nickname) {
      $scope.ctrl.players[nick].cards.get(card);
    } else {
      $scope.ctrl.players[nick].cards.pull(1);
    }
  });
});
