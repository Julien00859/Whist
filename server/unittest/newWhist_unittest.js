const _ = require("underscore");
const Whist = require("../whistNew").Whist;
const cardsLib = require("../cards");

test("Distribution", function() {
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

test("Détection de trou", function() {
  var partie = fabriquerUnePartie();

  ok(_.isNull(partie.checkForHole()), "Il n'y a pas trou dans cette configuration")
  ok(_.every(Object.keys(partie.players), function(pl){return partie.has1As(pl)}), "Ils sont tous potentiellement trou")

  partie.players["player 1"].cards.add(partie.players["player 2"].cards.get(cardsLib.getCardsFromString("♠A")));
  partie.players["player 1"].cards.add(partie.players["player 3"].cards.get(cardsLib.getCardsFromString("♦A")));
  equal(partie.checkForHole(), "player 1", "Le premier est trou");
  ok(_.chain(partie.players).keys().initial().every(function(pl){return !partie.has1As(pl)}), "Les 3 premiers ne sont pas bouche-trou");
  ok(partie.has1As("player 4"), "Le dernier est bouche-trou");
});


test("méthodes", function() {
  var partie = fabriquerUnePartie();
  equal(partie.getNextPlayer.call({currentPlayer: "player 1", playersList: ["player 1", "player 2", "player 3", "player 4"]}), "player 2", "getNextPlayer #1")
  equal(partie.getNextPlayer.call({currentPlayer: "player 2", playersList: ["player 1", "player 2", "player 3", "player 4"]}), "player 3", "getNextPlayer #2")
  equal(partie.getNextPlayer.call({currentPlayer: "player 3", playersList: ["player 1", "player 2", "player 3", "player 4"]}), "player 4", "getNextPlayer #3")
  equal(partie.getNextPlayer.call({currentPlayer: "player 4", playersList: ["player 1", "player 2", "player 3", "player 4"]}), "player 1", "getNextPlayer #4")

  var partie = fabriquerUnePartie();
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "premier"}},
      "player 2": {announce: {}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), "player 2", "getNextPlayerFollowingAnnounces #1");
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "passer"}},
      "player 2": {announce: {name: "passer"}},
      "player 3": {announce: {}},
      "player 4": {announce: {}},
    }
  }), "player 3", "getNextPlayerFollowingAnnounces #2");
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "Solo 6"}},
      "player 2": {announce: {name: "Abondance"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {}},
    }
  }), "player 4", "getNextPlayerFollowingAnnounces #3");
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "Premier", canTalk: true}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Passer"}},
      "player 4": {announce: {name: "Passer"}},
    }
  }), "player 1", "getNextPlayerFollowingAnnounces #4");
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "Grand chelem", canTalk: true}},
      "player 2": {announce: {name: "Grande misère", canTalk: true}},
      "player 3": {announce: {name: "Abondance 9", canTalk: true}},
      "player 4": {announce: {name: "Passer", canTalk: true}},
    }
  }), "player 3", "getNextPlayerFollowingAnnounces #5");
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "Passer"}},
      "player 2": {announce: {name: "Passer"}},
      "player 3": {announce: {name: "Solo 6", symbol: "Heart", canTalk: true}},
      "player 4": {announce: {name: "Solo 6", symbol: "Spade", canTalk: true}},
    }
  }), "player 4", "getNextPlayerFollowingAnnounces #6");
  equal(partie.getNextPlayerFollowingAnnounces.call({
    playersList: ["player 1", "player 2", "player 3", "player 4"],
    players:{
      "player 1": {announce: {name: "Emballage 8", symbol: "Club", canTalk: false}},
      "player 2": {announce: {name: "Emballage 8", symbol: "Club", canTalk: true}},
      "player 3": {announce: {name: "Solo 6", symbol: "Heart", canTalk: true}},
      "player 4": {announce: {name: "Solo 6", symbol: "Spade", canTalk: true}},
    }
  }), "player 2", "getNextPlayerFollowingAnnounces #7");
  deepEqual(partie.getAvailableAnnounces.call({
    state: 1,
    currentPlayer: "player 1",
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
    playersList: ["player 1", "player 2", "player 3", "player 4"],
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
