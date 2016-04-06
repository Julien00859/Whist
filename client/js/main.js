angular.module("whist", []).controller("Controller", function($scope, $timeout) {
  var self = this;

  self.socket = io()

  self.players = {
    playerX: {
      cards: Cards(),
      announce: "",
      symbol: "",
      folds: [Cards()],
      side: ""
    }
  };

  self.nickname = "";

  self.nicknameValidated = false;

  self.game = {
    started: false,
    trump: "",
    playersList: [],
    currentFold: Cards(),
    currentPlayer: "",
    state: 0
  };

  self.symbols = symbols.slice();

  self.needSymbolForm = function needSymbolForm(announce) {
    return _.contains(["Solo", "Emballage", "Abondance"], announce);
  };

  self.register = function register() {
    self.socket.emit("register", this.nickname);
  }

  self.socket.on("myerror", function(err){
    alert(err);
  });

  self.socket.on("nickname validation", function(nick){
    self.nickname = nick;
    self.nicknameValidated = true;
    $scope.$apply();
  });

  self.socket.on("waiting room joined", function(playersList){
    self.game.playersList = playersList;
    $scope.$apply();
  });

  self.socket.on("waiting room joined by", function(nick){
    self.game.playersList.push(nick);
    $scope.$apply();
  });

  self.socket.on("game joined", function(srvMsg){
    self.newNormalGame(srvMsg);
  });
  self.newNormalGame = function newNormalGame(srvMsg) {
    if (self.nicknameValidated) {
      self.game.playersList = srvMsg.players;

      for (var i in self.game.players) {
        self.players[self.game.playersList[i]] = {
          announce: undefined,
          myFriend: undefined,
          cards: self.game.playersList[i] == self.nickname ? new Cards(getCardsFromString(srvMsg.cards)) : new Cards((new Array(13)).fill(new HiddenCard())),
          folds: [],
          // Je serai toujours en bas, les autres me suivront dans l'ordre horlogique
          side: ["bottom","left","top","right"][(self.game.playersList.indexOf(self.game.playersList[i]) - self.game.playersList.indexOf(self.nickname) + 4) % 4]
        }
      }
      self.game.started = true;
      $scope.$apply();
    } else {
      // Tant que le nom n'a pas été validé, on met en attente le lancement de la partie
      console.log(this, "delayed");
      $timeout(self.newNormalGame, 100, true, srvMsg);
    }
  }

  self.getSideClass = function getSideClass(player, side){
    return {
      bottomSide: side == "bottom",
      leftSide: side == "left",
      topSide: side == "top",
      rightSide: side == "right",
      activeSide: player == self.game.currentPlayer
    }
  }

});
