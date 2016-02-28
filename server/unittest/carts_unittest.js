const _ = require("underscore");
const Carts = require("../carts.js").Carts;
const getCartsFromString = require("../carts.js").getCartsFromString;

test("Génération", function(){
  var jeu = new Carts();
  equal(jeu.getLength(), 52, "On a 52 cartes dans un jeu classique");
  deepEqual(_.uniq(jeu.carts.slice().map(function(c){return c.symbol}), true), ["Heart","Diamond","Club","Spade"], "On a que coeur, carreau, trèffle et pique");
  deepEqual(_.uniq(jeu.carts.slice().map(function(c){return c.name})), ["Two","Three","Four","Five","Six","Seven","Heigh","Nine","Ten","Valet","Queen","King","As"], "On a des noms allant de Deux à As");
  ok(_.every(jeu.carts, function(c){ return _.isNumber(c.value) && c.value >= 2 && c.value <= 14}), "On a des valeurs comprises entre 2 et 14 (As)");
})

test("Méthodes", function() {
  var jeu = new Carts();
  jeu.sort()
  var jeuComplet = jeu.carts.slice();
  var quelquesCartes = jeu.pull(52 - 13, 13);
  equal(quelquesCartes.length, 13, "Retirer 13 cartes");
  deepEqual(_.difference(jeuComplet, quelquesCartes), jeu.carts, "Aucune des cartes retirées ne se retrouve dans le jeu");

  jeu.add(quelquesCartes);
  deepEqual(jeu.carts, jeuComplet, "Rajouter les cartes retirées équivaut à restituer le jeu complet");

  var uneCarte = jeu.get(jeu.carts[51]);
  ok(_.isObject(uneCarte), "Une carte est bien un Objet Javascript");
  deepEqual(_.keys(uneCarte), ["value","symbol","name","toString"], "La carte a bien des propriétés value, symbol, name et une method toString");
  deepEqual(_.without(jeuComplet, uneCarte), jeu.carts, "La carte retirée ne se retrouve plus dans le jeu #1");
  equal(jeu.contains(uneCarte), false, "La carte retirée ne se retrouve plus dans le jeu #2")

  jeu.add(uneCarte);
  deepEqual(jeu.carts, jeuComplet, "Remettre cette carte restitue le jeu complet");
  ok(jeu.contains(uneCarte), "La carte est dans le jeu")

  var jeu2 = new Carts(getCartsFromString(jeu.toString()));
  jeu2.sort()
  equal(jeu2.toString(), jeu.toString(), "Un jeu de carte convertis en chaine de caractère et récupéré via la fonction equivaut au jeu de départ")
});
