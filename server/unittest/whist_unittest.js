const _ = require("underscore");
const Whist = require("../whist.js").Whist;

test("Distribution", function(){
  var partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  ok(_.isEmpty(partie.carts), "Le jeu est distribué dans son intégrité");
  ok(_.every(Object.keys(partie.players).map(function(p){return partie.players[p].carts.getLength() === 13})), "Chaque joueur a 13 cartes");
  // Il faudrait tester deux à deux pour chacun des joueurs
  var players = Object.keys(partie.players);
  var i = 0
  for (var p1 in players) {
    var others = _.rest(players, +p1 + 1)
    for (var p2 in others) {
      ok(_.isEmpty(_.intersection(partie.players[players[p1]].carts.carts, partie.players[others[p2]].carts.carts)), "Aucune carte en commun entre les joueurs #" + ++i);
    }
  }
})

test("Annonces", function() {
  var partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  var curPlayer = partie.currentPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Passer"})), "Si un joueur peut jouer");
  _.difference(Object.keys(partie.players), [partie.currentPlayer]).forEach(function(player, i){
    partie.currentPlayer = curPlayer;
    raises(function() {partie.playTurn(player, {announce: "Passer"})}, "Alors les autres non #" + (+i+1))
  });

  partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Premier"})), "Le premier peut annoncer Premier");
  _.without(Object.keys(partie.players), partie.currentPlayer).forEach(function(player, i){
    partie.currentPlayer = player;
    raises(function() {partie.playTurn(player, {announce: "Premier"})}, "Mais pas les autres #" + (+i+1))
  });

  partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  curPlayer = partie.currentPlayer;
  ok(_.isUndefined(partie.playTurn(curPlayer, {announce: "Solo", announceLevel: 0, announceSymbol: "Heart"})), "On peut annoncer Solo");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Petite misère"})), "Surenchérir vers Petite misère");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Abondance 9"})), "Surenchérir vers Abondance 9");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Trou"})), "Surenchérir vers Trou");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Grande misère"})), "Surenchérir vers Grande misère");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Abondance 10"})), "Surenchérir vers Abondance 10");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Abondance 11"})), "Surenchérir vers Abondance 11");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Grande misère étalée"})), "Surenchérir vers Grande misère étalée");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Petit chelem"})), "Surenchérir vers Petit chelem");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Grand chelem"})), "Surenchérir vers Grand chelem");
  partie.currentPlayer = curPlayer;
  raises(function() {partie.playTurn(partie.currentPlayer, {announce: "Petit chelem"})}, "On ne peut pas descendre dans les annonces");
  partie.currentPlayer = curPlayer;
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Passer"})), "On peut toujours passer (sauf prochain cas)");
  partie.currentPlayer = curPlayer;
  raises(function() {partie.playTurn(partie.currentPlayer, {announce: "Petite misère"})}, "On ne peut pas annoncer si on a passé");
  partie.currentPlayer = curPlayer;

  partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  curPlayer = partie.currentPlayer;
  partie.playTurn(curPlayer, {announce: "Passer"});
  equal(partie.currentPlayer, partie.nextPlayer(curPlayer), "Lorsqu'un joueur a joué, on donne la parole au suivant");
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  equal(partie.state, partie.STATE_ANNOUNCE, "Tant que tout le monde n'a pas passé, les annonces continuent #1");
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  equal(partie.state, partie.STATE_END, "Si tout le monde passe, la partie s'arrête");

  partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  partie.playTurn(partie.currentPlayer, {announce: "Premier"});
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  equal(partie.state, partie.STATE_ANNOUNCE, "Tant que tout le monde n'a pas passé, les annonces continuent #2");
  partie.playTurn(partie.currentPlayer, {announce: "Solo", announceSymbol: "Heart", announceLevel: 0});
  raises(function() {partie.playTurn(partie.currentPlayer, {announce: "Solo", announceSymbol: "Spade", announceLevel: 0})}, "Un joueur qui annonce premier ne peut pas annoncer solo");
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  equal(partie.state, partie.STATE_PLAY, "Si il ne reste qu'un joueur n'ayant pas passé, la partie se lance");

  partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
  raises(function() {partie.playTurn(partie.currentPlayer, {announce: "Emballage", announceSymbol: "Heart", announceLevel: 0})}, "On ne peut pas annoncer Emballage si personne n'avait annoncé solo pour ce symbole avant");
  partie.playTurn(partie.currentPlayer, {announce: "Solo", announceSymbol: "Heart", announceLevel: 0});
  partie.playTurn(partie.currentPlayer, {announce: "Emballage", announceSymbol: "Heart", announceLevel: 0});
  equal(partie.players["Player 1"].announce.name && partie.players["Player 2"].announce.name, "Emballage", "Solo devient Emballage lorsqu'on se fait emballer");
  equal(partie.players["Player 1"].announce.symbol && partie.players["Player 2"].announce.symbol, "Heart", "Le symbole est commun aux deux");
  partie.playTurn(partie.currentPlayer, {announce: "Solo", announceSymbol: "Diamond", announceLevel: 0});
  partie.playTurn(partie.currentPlayer, {announce: "Solo", announceSymbol: "Diamond", announceLevel: 0});
  equal(partie.players["Player 4"].announce.name, "Emballage", "Par contre l'inverse, annoncer Solo pour un symbole déjà annoncé transforme l'annonce en emballage");
  equal(partie.state, partie.STATE_ANNOUNCE, "Tout le monde a annoncé, on entre dans les surenchères");
  equal(partie.players["Player 1"].announce.canTalk && partie.players["Player 3"].announce.canTalk, false, "Les joueurs emballés perdent la parole");
  equal(partie.currentPlayer, "Player 2", "Les joueurs muets sont passés par la rotation automatique");
  partie.currentPlayer = "Player 1";
  raises(function() {partie.playTurn("Player 1", {announce: "Passer"})}, "Même en cas d'intervention divine partielle, ils ne peuvent pas parler");
  partie.currentPlayer = "Player 2";
  partie.playTurn(partie.currentPlayer, {announce: "Passer"});
  equal(partie.state, partie.STATE_PLAY, "Si il ne reste que deux joueurs emballés en enchère, la partie se lance");

  partie = new Whist("Player 1", "Player 2", "Player 3", "Player 4");
});
