const _ = require("underscore");
const Whist = require("../whistNew").Whist;
const WhistError = require("../whistNew").WhistError;
const cardsLib = require("../cards");

test("new Whist()", function() {
  raises(function() {new Whist(["player 1", "player 2", "player 3"])}, "Impossible de lancer une partie sans avoir 4 joueurs");

  var partie = new Whist(["player 1", "player 2", "player 3", "player 4"]);
  ok(_.every(Object.keys(partie.players).map(function(p){return partie.players[p].cards.getLength() === 13})), "Chaque joueur a 13 cartes");
  var players = Object.keys(partie.players);
  for (var p1 in players) {
    var others = _.rest(players, +p1 + 1)
    for (var p2 in others) {
      ok(_.isEmpty(_.intersection(partie.players[players[p1]].cards.cards, partie.players[others[p2]].cards.cards)), "Aucune carte en commun entre \"" + players[p1] + "\" et \"" + others[p2] + "\"");
    }
  }
  ok(partie.state == 1 || partie.state == 2, "Lorsqu'on lance une partie, son état est aux annonces");
});

test("checkForHole, has1As", function() {
  var partie = fabriquerUnePartie();

  ok(_.isNull(partie.checkForHole()), "checkForHole #1")
  ok(_.every(Object.keys(partie.players), function(pl){return partie.has1As(pl)}), "has1As #1")

  partie.players["player 1"].cards.add(partie.players["player 2"].cards.get(cardsLib.getCardsFromString("♠A")));
  partie.players["player 1"].cards.add(partie.players["player 3"].cards.get(cardsLib.getCardsFromString("♦A")));
  equal(partie.checkForHole(), "player 1", "checkForHole #2");
  ok(_.chain(partie.players).keys().initial().every(function(pl){return !partie.has1As(pl)}), "has1As #2");
  ok(partie.has1As("player 4"), "has1As #3");
});


test("getNextPlayer", function() {
  var partie = fabriquerUnePartie();
  equal(partie.getNextPlayer.call({currentPlayer: "player 1", playersList: partie.playersList}), "player 2", "getNextPlayer #1")
  equal(partie.getNextPlayer.call({currentPlayer: "player 2", playersList: partie.playersList}), "player 3", "getNextPlayer #2")
  equal(partie.getNextPlayer.call({currentPlayer: "player 3", playersList: partie.playersList}), "player 4", "getNextPlayer #3")
  equal(partie.getNextPlayer.call({currentPlayer: "player 4", playersList: partie.playersList}), "player 1", "getNextPlayer #4")
});

test("getNextPlayerFollowingAnnounces", function(){
  var partie = fabriquerUnePartie();

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "premier"}},
      "player 2": {announce: {}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), "player 2", "getNextPlayerFollowingAnnounces #1");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "passer"}},
      "player 2": {announce: {name: "passer"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), "player 3", "getNextPlayerFollowingAnnounces #2");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Solo 6"}},
      "player 2": {announce: {name: "Abondance"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {}},
    }
  }), "player 4", "getNextPlayerFollowingAnnounces #3");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier", canTalk: true}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), "player 1", "getNextPlayerFollowingAnnounces #4");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Grand chelem", canTalk: true}},
      "player 2": {announce: {name: "Grande misère", canTalk: true}},
      "player 3": {announce: {name: "Abondance 9", canTalk: true}},
      "player 4": {announce: {name: "Passer", canTalk: true}},
    }
  }), "player 3", "getNextPlayerFollowingAnnounces #5");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Passer"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Solo 6", symbol: "Heart", canTalk: true}},
      "player 4": {announce: {name: "Solo 6", symbol: "Spade", canTalk: true}},
    }
  }), "player 4", "getNextPlayerFollowingAnnounces #6");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Emballage 8", symbol: "Club", canTalk: false}},
      "player 2": {announce: {name: "Emballage 8", symbol: "Club", canTalk: true}},
      "player 3": {announce: {name: "Solo 6", symbol: "Heart", canTalk: true}},
      "player 4": {announce: {name: "Solo 6", symbol: "Spade", canTalk: true}},
    }
  }), "player 2", "getNextPlayerFollowingAnnounces #7");

  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou", canTalk: true}},
      "player 2": {announce: {name: "Bouche-trou", canTalk: true}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), "player 2", "getNextPlayerFollowingAnnounces #9");
});

test("getAvailableAnnounces",  function() {
  var partie = fabriquerUnePartie();

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 1",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {}},
      "player 2": {announce: {}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Premier",
    "Solo 6",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #1");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 2",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier"}},
      "player 2": {announce: {}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Passer",
    "Solo 6",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #2");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 3",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier"}},
      "player 2": {announce: {name: "Solo 6", symbol: "Heart"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Passer",
    "Solo 6",
    "Emballage 8",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #3");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 3",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Passer"}},
      "player 2": {announce: {name: "Solo 6", symbol: "Heart"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {}},
    }
  }), [
    "Passer",
    "Solo 6",
    "Emballage 8",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #4");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 3",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {}},
    }
  }), [
    "Passer",
    "Solo 6",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #5");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 4",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Passer"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {}},
    }
  }), [
    "Passer",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #6");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 1",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), [
    "Passer",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #7");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 1",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier"}},
      "player 2": {announce: {name: "Solo 6", symbol: "Heart"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), [
    "Passer",
    "Solo 6",
    "Emballage 8",
    "Petite misère",
    "Piccolo",
    "Abondance 9",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #8");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 2,
    currentPlayer: "player 1",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou"}},
      "player 2": {announce: {name: "Bouche-trou"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Trou",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #9");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 2,
    currentPlayer: "player 1",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou"}},
      "player 2": {announce: {name: "Bouche-trou"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Trou",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #10");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 2,
    currentPlayer: "player 2",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou"}},
      "player 2": {announce: {name: "Bouche-trou"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Bouche-trou",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #11");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 2,
    currentPlayer: "player 3",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou"}},
      "player 2": {announce: {name: "Bouche-trou"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), [
    "Passer",
    "Grande misère",
    "Abondance 10",
    "Abondance 11",
    "Grande misère étalée",
    "Petit chelem",
    "Grand chelem"
  ], "getAvailableAnnounces #12");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 3,
    currentPlayer: "player 1",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Solo 6", symbol: "Spade"}},
      "player 2": {announce: {name: "Emballage 8", symbol: "Heart"}},
      "player 3": {announce: {name: "Emballage 8", symbol: "Heart"}},
      "player 4": {announce: {name: "Solo 6", symbol: "Club"}},
    }
  }), [
    "Emballer",
    "Enchérir",
    "Passer"
  ], "getAvailableAnnounces #13");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 3,
    currentPlayer: "player 2",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Solo 6", symbol: "Spade"}},
      "player 2": {announce: {name: "Emballage 8", symbol: "Heart"}},
      "player 3": {announce: {name: "Emballage 8", symbol: "Heart"}},
      "player 4": {announce: {name: "Solo 6", symbol: "Club"}},
    }
  }), [
    "Enchérir",
    "Passer"
  ], "getAvailableAnnounces #14");

  deepEqual(partie.getAvailableAnnounces.call({
    state: 3,
    currentPlayer: "player 4",
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Passer"}},
      "player 2": {announce: {name: "Emballage 13", symbol: "Heart"}},
      "player 3": {announce: {name: "Emballage 13", symbol: "Heart"}},
      "player 4": {announce: {name: "Solo 8", symbol: "Club"}},
    }
  }), ["Passer"], "getAvailableAnnounces #15");

});

test("getComputedState", function(){
  var partie = fabriquerUnePartie();
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {}},
      "player 2": {announce: {}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), 1, "getComputedState #1");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Solo 6"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {}},
    }
  }), 1, "getComputedState #2");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Premier"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 1, "getComputedState #3");
  equal(partie.getComputedState.call({
    state: 2,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou", holeConfirmed: false}},
      "player 2": {announce: {name: "Bouche-trou", holeConfirmed: false}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 2, "getComputedState #4");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Petite misère"}},
      "player 2": {announce: {name: "Solo 6", symbol: "Heart"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 3, "getComputedState #5");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Petite misère"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 4, "getComputedState #6");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Abondance 9", symbol: "Diamond"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 5, "getComputedState #7");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Emballage 8", symbol: "Heart"}},
      "player 2": {announce: {name: "Emballage 8", symbol: "Heart"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 5, "getComputedState #8");
  equal(partie.getComputedState.call({
    state: 2,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Trou", holeConfirmed: true}},
      "player 2": {announce: {name: "Bouche-trou", holeConfirmed: true}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 5, "getComputedState #9");
  equal(partie.getComputedState.call({
    state: 1,
    playersList: partie.playersList,
    players:{
      "player 1": {announce: {name: "Passer"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), 6, "getComputedState #10");
  equal(partie.getComputedState.call({
    state: 4,
    playersList: partie.playersList,
    players:{
      "player 1": {cards: partie.players["player 1"].cards},
      "player 2": {cards: partie.players["player 2"].cards},
      "player 3": {cards: partie.players["player 3"].cards},
      "player 4": {cards: partie.players["player 4"].cards},
    }
  }), 4, "getComputedState #11");

  partie.players["player 1"].cards.pull(1);
  partie.players["player 2"].cards.pull(1);
  partie.players["player 3"].cards.pull(1);
  equal(partie.getComputedState.call({
    state: 4,
    playersList: partie.playersList,
    players:{
      "player 1": {cards: partie.players["player 1"].cards},
      "player 2": {cards: partie.players["player 2"].cards},
      "player 3": {cards: partie.players["player 3"].cards},
      "player 4": {cards: partie.players["player 4"].cards},
    }
  }), 4, "getComputedState #12");

  partie.players["player 4"].cards.pull(1);
  equal(partie.getComputedState.call({
    state: 4,
    playersList: partie.playersList,
    players:{
      "player 1": {cards: partie.players["player 1"].cards},
      "player 2": {cards: partie.players["player 2"].cards},
      "player 3": {cards: partie.players["player 3"].cards},
      "player 4": {cards: partie.players["player 4"].cards},
    }
  }), 5, "getComputedState #13");
  equal(partie.getComputedState.call({
    state: 5,
    playersList: partie.playersList,
    players:{
      "player 1": {cards: partie.players["player 1"].cards},
      "player 2": {cards: partie.players["player 2"].cards},
      "player 3": {cards: partie.players["player 3"].cards},
      "player 4": {cards: partie.players["player 4"].cards},
    }
  }), 5, "getComputedState #14");

  partie.players["player 1"].cards.pull(12);
  partie.players["player 2"].cards.pull(12);
  partie.players["player 3"].cards.pull(12);
  partie.players["player 4"].cards.pull(12);
  equal(partie.getComputedState.call({
    state: 5,
    playersList: partie.playersList,
    players:{
      "player 1": {cards: partie.players["player 1"].cards},
      "player 2": {cards: partie.players["player 2"].cards},
      "player 3": {cards: partie.players["player 3"].cards},
      "player 4": {cards: partie.players["player 4"].cards},
    }
  }), 6, "getComputedState #15");
});

test("play", function(){
  var partie = fabriquerUnePartie();
  throws(function(){
    partie.play("player 2")
  }, function(err){
    return err.message == "Ce n'est pas à ton tour de jouer";
  }, "play #1");
  throws(function(){
    partie.play.call({
      currentPlayer: "player 1",
      state: 1
    }, "player 1")
  }, function(err){
    return err.message == "L'annonce doit être définie et de type string";
  }, "play #2");
  throws(function(){
    partie.play.call({
      currentPlayer: "player 1",
      state: 1
    }, "player 1", 1)
  }, function(err){
    return err.message == "L'annonce doit être définie et de type string";
  }, "play #3");
  throws(function(){
    partie.play.call({
      currentPlayer: "player 1",
      state: 1
    }, "player 1", "nimporte quoi")
  }, function(err){
    return err.message == "L'annonce n'existe pas";
  }, "play #4");
  throws(function(){
    partie.play.call({
      currentPlayer: "player 1",
      state: 1,
      players: {
        "player 1": {announce: {}}
      }
    }, "player 1", "Solo 6")
  }, function(err){
    return err.message == "Le symbole doit être défini et de type string";
  }, "play #5");
  throws(function(){
    partie.play.call({
      currentPlayer: "player 1",
      state: 1,
      players: {
        "player 1": {announce: {}}
      }
    }, "player 1", "Solo 6", "nimporte quoi")
  }, function(err){
    return err.message == "Le symbole n'existe pas";
  }, "play #6");





  throws(function(){
    partie.play.call({
      currentPlayer: "player 1",
      state: 6
    }, "player 1")
  }, function(err){
    return err.message == "La partie est terminée";
  }, "play #2");
});

function fabriquerUnePartie() {
  var partie = new Whist(["player 1", "player 2", "player 3", "player 4"]);
  partie.resetGame();
  partie.players["player 1"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♥A ♥2 ♥3 ♥4 ♥5 ♥6 ♥7 ♥8 ♥9 ♥10 ♥V ♥Q ♥K"));
  partie.players["player 2"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♠A ♠2 ♠3 ♠4 ♠5 ♠6 ♠7 ♠8 ♠9 ♠10 ♠V ♠Q ♠K"));
  partie.players["player 3"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♦A ♦2 ♦3 ♦4 ♦5 ♦6 ♦7 ♦8 ♦9 ♦10 ♦V ♦Q ♦K"));
  partie.players["player 4"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♣A ♣2 ♣3 ♣4 ♣5 ♣6 ♣7 ♣8 ♣9 ♣10 ♣V ♣Q ♣K"));
  partie.currentPlayer = "player 1";
  partie.state = 1;

  return partie;
}
