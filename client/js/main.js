angular.module("whist", []).controller("Controller", function($scope, $timeout) {
  var self = this;

  self.socket = io()

  self.players = {
    // playerX: {
    //   cards: Cards(),
    //   announce: "",
    //   symbol: "",
    //   folds: [Cards()],
    //   side: ""
    // }
  };

  self.nickname = "";

  self.nicknameValidated = false;

  self.game = {
    started: false,
    trump: "",
    playersList: [],
    currentFold: new Cards([]),
    currentPlayer: "",
    state: 0
  };

  self.availableAnnounces = ["Passer"];

  self.selectedAnnounce = undefined;

  self.selectedSymbol = undefined;

  self.symbols = symbols.slice();

  self.needSymbolForm = function needSymbolForm() {
    return !_.isUndefined(self.selectedAnnounce) && _.contains(["Solo", "Emballage", "Abondance", "Emballage"], self.selectedAnnounce.split(" ")[0]);
  };

  self.getSideClass = function getSideClass(player, side){
    return {
      bottomSide: side == "bottom",
      leftSide: side == "left",
      topSide: side == "top",
      rightSide: side == "right",
      activeSide: player == self.game.currentPlayer
    }
  }

  self.register = function register() {
    self.socket.emit("register", self.nickname);
  }

  self.submitAnnounce = function submitAnnounce() {
    if (self.needSymbolForm(self.selectedAnnounce)) self.socket.emit("play", self.selectedAnnounce, self.selectedSymbol);
    else self.socket.emit("play", self.selectedAnnounce);
  }

  self.sendCard = function sendCard(card) {
    if (self.players[self.nickname].cards.contains(card)) {
      if (self.game.currentPlayer == self.nickname) {
        if (self.game.state > 3) {
          self.socket.emit("play", card.toString());
        }
      }
    }
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

      for (var i in self.game.playersList) {
        self.players[self.game.playersList[i]] = {
          announce: undefined,
          myFriend: undefined,
          cards: self.game.playersList[i] == self.nickname ? new Cards(getCardsFromString(srvMsg.cards).reverse()) : new Cards((new Array(13)).fill(new HiddenCard())),
          folds: [],
          // Je serai toujours en bas, les autres me suivront dans l'ordre horlogique
          side: ["bottom","left","top","right"][(self.game.playersList.indexOf(self.game.playersList[i]) - self.game.playersList.indexOf(self.nickname) + 4) % 4]
        }
      }
      self.game.started = true;
      $scope.$apply();
      resize();
    } else {
      // Tant que le nom n'a pas été validé, on met en attente le lancement de la partie
      console.log(this, "delayed");
      $timeout(self.newNormalGame, 100, true, srvMsg);
    }
  }

  self.socket.on("announces", function(srvAnn){
    for (var i in srvAnn) {
      self.players[srvAnn[i].player].announce = srvAnn[i].announce;
      self.players[srvAnn[i].player].symbol = srvAnn[i].symbol;
    }
    $scope.$apply();
  });

  self.socket.on("next turn", function(srvMsg){
    self.game.currentPlayer = srvMsg.currentPlayer;
    self.game.state = srvMsg.state;
    $scope.$apply();
  });

  self.socket.on("availableAnnounces", function(announces){
    self.availableAnnounces = announces;
    $scope.$apply();
  });

  self.socket.on("card played", function(player, cardStr){
    if (player == self.nickname) {
      self.game.currentFold.add(self.players[player].cards.get(getCardsFromString(cardStr)));
    } else {
      self.players[player].cards.pull(1);
      self.game.currentFold.add(getCardsFromString(cardStr));
    }
  });

  self.socket.on("turn won by", function(player){
    self.players[player].folds.push(self.game.currentFold.pull(4));
  });

  self.socket.on("card retrieved", function(player){
    self.players[player].cards.pull(1);
  });

  self.socket.on("trump", function(trump){
    self.game.trump = trump;
  });
});
