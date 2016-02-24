const _ = require("underscore");
const carts = require("../carts.js");

test("Carts() ", function(){
  var jeu = new carts.Carts();
  jeu.sort()
  var jeuComplet = jeu.carts.slice();

  equal(jeu.getLength(), 52, "getLength method");
  deepEqual(_.uniq(jeu.carts.slice().map(function(c){return c.symbol}), true), ["Heart","Diamond","Club","Spade"], "4 symbols");
  deepEqual(_.uniq(jeu.carts.slice().map(function(c){return c.name})), ["As","King","Queen","Valet","Ten","Nine","Heigh","Seven","Six","Five","Four","Three","Two"], "13 names");
  ok(_.every(jeu.carts, function(c){ return _.isNumber(c.value) && c.value >= 2 && c.value <= 14}), "each value is in [2;14]");

  var quelquesCartes = jeu.pull(52 - 13, 13);
  equal(quelquesCartes.length, 13, "pull method, length");
  deepEqual(_.difference(jeuComplet, quelquesCartes), jeu.carts, "pull method, carts");

  jeu.add(quelquesCartes);
  deepEqual(jeu.carts, jeuComplet, "add method, multiple carts");

  var uneCarte = jeu.get(jeu.carts[51]);
  ok(_.isObject(uneCarte), "get method, type");
  deepEqual(_.keys(uneCarte), ["value","symbol","name","toString"], "get method, keys");
  deepEqual(_.difference(jeuComplet, [uneCarte]), jeu.carts, "get method, carts");

  jeu.add(uneCarte);
  deepEqual(jeu.carts, jeuComplet, "add method, one cart");
});

test("Whist()", function(){
  var partie = new carts.Whist("Player 1", "Player 2", "Player 3", "Player 4");
  ok(_.isEmpty(partie.carts), "Le jeu est distribué dans son intégrité");
  ok(_.every(Object.keys(partie.players).map(function(p){return partie.players[p].carts.getLength() === 13})), "Chaque joueur a 13 cartes");
  ok(_.isEmpty(_.intersection.apply(Object.keys(partie.players).map(function(p){return partie.players[p].carts}))), "Chaque joueur a des cartes différentes des autres");
  ok(_.isUndefined(partie.playTurn(partie.currentPlayer, {announce: "Passer"})), "Le joueur courant peut jouer");
  _.difference(Object.keys(partie.players), [partie.currentPlayer]).forEach(function(player, i){
    raises(function() {partie.playTurn(player, {announce: "Passer"})}, "Les autres ne peuvent pas jouer #" + (+i+1))
  });
});
