const _ = require("underscore");
const Whist = require("../whist").Whist;

test("Distribution", function() {
  raises(function() {new Whist(["player 1", "player 2", "player 3"])}, "Impossible de lancer une partie sans avoir 4 joueurs");

  var partie = new Whist(["player 1", "player 2", "player 3", "player 4"]);
  ok(_.isEmpty(partie.carts), "Le jeu est distribué dans son intégrité");
  ok(_.every(Object.keys(partie.players).map(function(p){return partie.players[p].cards.getLength() === 13})), "Chaque joueur a 13 cartes");
  var players = Object.keys(partie.players);
  for (var p1 in players) {
    var others = _.rest(players, +p1 + 1)
    for (var p2 in others) {
      ok(_.isEmpty(_.intersection(partie.players[players[p1]].cards.cards, partie.players[others[p2]].cards.cards)), "Aucune carte en commun entre \"" + players[p1] + "\" et \"" + others[p2] + "\"");
    }
  }
  ok(partie.state == 0 || partie.state == 1, "Lorsqu'on lance une partie, son état est aux annonces");
})
