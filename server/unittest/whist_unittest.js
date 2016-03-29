const _ = require("underscore");
const Whist = require("../whist").Whist;
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

  ok(_.isUndefined(partie.checkForHole()), "Il n'y a pas trou dans cette configuration")
  ok(_.every(Object.keys(partie.players), function(pl){return partie.isDick(pl)}), "Ils sont tous potentiellement trou")

  partie.players["player 1"].cards.add(partie.players["player 2"].cards.get(cardsLib.getCardsFromString("♠A")));
  partie.players["player 1"].cards.add(partie.players["player 3"].cards.get(cardsLib.getCardsFromString("♦A")));
  equal(partie.checkForHole(), "player 1", "Le premier est trou");
  ok(_.chain(partie.players).keys().initial().every(function(pl){return !partie.isDick(pl)}), "Les 3 premiers ne sont pas bouche-trou");
  ok(partie.isDick("player 4"), "Le dernier est bouche-trou");
});

test("Arguments de playTurn", function() {
  var partie = fabriquerUnePartie();
  throws(
    function(){partie.playTurn("player 2")},
    function(err){return err.message === "Ce n'est pas au tour du joueur donné"},
    "Lorsque c'est 'joueur 1' qui est currentPlayer, 'player 2' ne peut pas jouer"
  );
  throws(
    function(){partie.playTurn("player 3")},
    function(err){return err.message === "Ce n'est pas au tour du joueur donné"},
    "Lorsque c'est 'joueur 1' qui est currentPlayer, 'player 3' ne peut pas jouer"
  );
  throws(
    function(){partie.playTurn("player 4")},
    function(err){return err.message === "Ce n'est pas au tour du joueur donné"},
    "Lorsque c'est 'joueur 1' qui est currentPlayer, 'player 4' ne peut pas jouer"
  );
  ok(_.isUndefined(partie.playTurn("player 1", {announce: "Passer"})), "Lorsque c'est 'joueur 1' qui est currentPlayer, 'joueur 1' peut jouer");
  equal(partie.currentPlayer, "player 2", "Après le tour de 'player 1' vient le tour de 'player 2'");

  throws(
    function(){partie.playTurn("player 2")},
    function(err){return err.message === "Il doit y avoir deux arguments"},
    "Il doit y avoir deux arguments"
  );
  throws(
    function(){partie.playTurn("player 2", 12)},
    function(err){return err.message === "Le second argument doit être un objet"},
    "Le second argument doit être un objet"
  );
});

test("Announces", function() {
  var partie = fabriquerUnePartie();
  throws(
    function(){partie.playTurn("player 1", {})},
    function(err){return err.message === "La clef 'announce' est absente du message"},
    "Le message doit contenir la clef 'announce'"
  );
  throws(
    function(){partie.playTurn("player 1", {announce: "n'importe quoi"})},
    function(err){return err.message === "L'annonce n'existe pas"},
    "L'annonce doit exister et être applicable dans le contexte actuelle"
  );
  throws(
    function(){partie.playTurn("player 1", {announce: "Solo"})},
    function(err){return err.message === "La cle 'announceSymbol' est absente du message"},
    "Si on annonce Solo, Emballage ou Abondance, une clef 'announceSymbol' doit accompagner l'annonce"
  );
  throws(
    function(){partie.playTurn("player 1", {announce: "Solo", announceSymbol: "n'importe quoi"})},
    function(err){return err.message === "Le symbole n'existe pas"},
    "Si on annonce Solo, Emballage ou Abondance, le symbole associé à announceSymbol doit être valide"
  );

  ok(_.every(partie.getAvailableAnnounces().map(function(ann) {
    // Pour l'emballage, on virtualise un second joueur ayant annoncé solo dans ce symbole
    if (ann === "Emballage") {
      partie.players["player 2"].announce.name = "Heart";
      partie.players["player 2"].announce.symbol = "Heart";
    } else {
      partie.players["player 2"].announce.name = undefined;
      partie.players["player 2"].announce.symbol = undefined;
    }
    partie.currentPlayer = "player 1";
    partie.players["player 1"].announce.name = undefined;
    partie.players["player 1"].announce.symbol = undefined;
    return _.isUndefined(partie.playTurn("player 1", {announce: ann, announceSymbol: "Heart"}));
  })), "Toute les annonces obtenues par la méthode 'getAvailableAnnounces' sont valides")

  throws(
    function(){partie.playTurn("player 2", {announce: "Solo", announceSymbol: "Heart"})},
    function(err){return err.message === "Le joueur doit posséder au moins une carte du symbole annoncé"},
    "Un joueur n'ayant pas de coeur le peut pas annoncer coeur");
  throws(
    function(){partie.playTurn("player 2", {announce: "Solo", announceSymbol: "Club"})},
    function(err){return err.message === "Le joueur doit posséder au moins une carte du symbole annoncé"},
    "Un joueur n'ayant pas de treffle ne peut pas announcer treffle");
  throws(
    function(){partie.playTurn("player 2", {announce: "Solo", announceSymbol: "Diamond"})},
    function(err){return err.message === "Le joueur doit posséder au moins une carte du symbole annoncé"},
    "Un joueur n'ayant pas de carreau ne peut pas annoncer carreau");
  ok( _.isUndefined(partie.playTurn("player 2", {announce: "Solo", announceSymbol: "Spade"})), "Un joueur ayant du pique peut annoncer pique");
});

function fabriquerUnePartie() {
  var partie = new Whist(["player 1", "player 2", "player 3", "player 4"]);
  partie.reset();
  partie.players["player 1"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♥A ♥2 ♥3 ♥4 ♥5 ♥6 ♥7 ♥8 ♥9 ♥10 ♥V ♥Q ♥K"));
  partie.players["player 2"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♠A ♠2 ♠3 ♠4 ♠5 ♠6 ♠7 ♠8 ♠9 ♠10 ♠V ♠Q ♠K"));
  partie.players["player 3"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♦A ♦2 ♦3 ♦4 ♦5 ♦6 ♦7 ♦8 ♦9 ♦10 ♦V ♦Q ♦K"));
  partie.players["player 4"].cards = new cardsLib.Cards(cardsLib.getCardsFromString("♣A ♣2 ♣3 ♣4 ♣5 ♣6 ♣7 ♣8 ♣9 ♣10 ♣V ♣Q ♣K"));
  partie.currentPlayer = "player 1";
  partie.state = 1;

  return partie;
}
