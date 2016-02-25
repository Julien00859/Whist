const _ = require("underscore");
const carts = require("../carts.js");

test("Carts() ", function(){
  var jeu = new carts.Carts();
  jeu.sort()
  var jeuComplet = jeu.carts.slice();

  equal(jeu.getLength(), 52, "On a 52 cartes dans un jeu classique");
  deepEqual(_.uniq(jeu.carts.slice().map(function(c){return c.symbol}), true), ["Heart","Diamond","Club","Spade"], "On a que coeur, carreau, trèffle et pique");
  deepEqual(_.uniq(jeu.carts.slice().map(function(c){return c.name})), ["As","King","Queen","Valet","Ten","Nine","Heigh","Seven","Six","Five","Four","Three","Two"], "On a des noms allant de Deux à As");
  ok(_.every(jeu.carts, function(c){ return _.isNumber(c.value) && c.value >= 2 && c.value <= 14}), "On a des valeurs comprises entre 2 et 14 (As)");

  var quelquesCartes = jeu.pull(52 - 13, 13);
  equal(quelquesCartes.length, 13, "Retirer 13 cartes");
  deepEqual(_.difference(jeuComplet, quelquesCartes), jeu.carts, "Aucune des cartes retirées ne se retrouve dans le jeu");

  jeu.add(quelquesCartes);
  deepEqual(jeu.carts, jeuComplet, "Rajouter les cartes retirées équivaut à restituer le jeu complet");

  var uneCarte = jeu.get(jeu.carts[51]);
  ok(_.isObject(uneCarte), "Une carte est bien un Objet Javascript");
  deepEqual(_.keys(uneCarte), ["value","symbol","name","toString"], "La carte a bien des propriétés value, symbol, name et une method toString");
  deepEqual(_.without(jeuComplet, uneCarte), jeu.carts, "La carte retirée ne se retrouve plus dans le jeu");

  jeu.add(uneCarte);
  deepEqual(jeu.carts, jeuComplet, "Remettre cette carte restitue le jeu complet");
});

test("Whist()", function(){

  var partie = new carts.Whist("Player 1", "Player 2", "Player 3", "Player 4");
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
  ok(_.isEmpty(_.intersection.apply(Object.keys(partie.players).map(function(p){return partie.players[p].carts}))), "Chaque joueur a des cartes différentes des autres");

  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Passer"})), "Le joueur courant peut jouer");
  _.difference(Object.keys(partie.players), [partie.currentPlayer]).forEach(function(player, i){
    raises(function() {partie.playTurn(player, {announce: "Passer"})}, "Mais pas les autres #" + (+i+1))
  });

  partie = new carts.Whist("Player 1", "Player 2", "Player 3", "Player 4");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Premier"})), "Le premier peut annoncer Premier");
  _.without(Object.keys(partie.players), partie.currentPlayer).forEach(function(player, i){
    partie.currentPlayer = player;
    raises(function() {partie.playTurn(player, {announce: "Premier"})}, "Mais pas les autres #" + (+i+1))
  });

  partie = new carts.Whist("Player 1", "Player 2", "Player 3", "Player 4");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Solo", announceLevel: 0, announceSymbol: "Heart"})), "On peut annoncer Solo");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Petite misère"})), "Surenchérir vers Petite misère");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Abondance 9"})), "Surenchérir vers Abondance 9");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Trou"})), "Surenchérir vers Trou");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Grande misère"})), "Surenchérir vers Grande misère");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Abondance 10"})), "Surenchérir vers Abondance 10");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Abondance 11"})), "Surenchérir vers Abondance 11");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Grande misère étalée"})), "Surenchérir vers Grande misère étalée");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Petit chelem"})), "Surenchérir vers Petit chelem");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Grand chelem"})), "Surenchérir vers Grand chelem");
  raises(function() {partie.playTurn(partie.currentPlayer, {announce: "Petit chelem"})}, "On ne peut pas descendre dans les annonces");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Passer"})), "On peut toujours passer (sauf prochain cas)");
  raises(function() {partie.playTurn(partie.currentPlayer, {announce: "Petite misère"})}, "On ne peut pas annoncer si on a passé");

});
