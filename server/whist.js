const _ = require("underscore");
const Carts = require("./carts.js").Carts;

var Whist = function Whist(player1, player2, player3, player4) {
  Carts.call(this);
  this.shuffle()

  this.announces = {
    "Grand chelem": {
      success: 200,
      looseMe: -200,
      looseOthers: 66,
      strength: 19

    },
    "Petit chelem": {
      success: 100,
      looseMe: -100,
      looseOthers: 33,
      strength: 18
    },
    "Grande misère étalée": {
      success: 75,
      looseMe: -75,
      looseOthers: 32,
      strength: 17
    },
    "Abondance 11": {
      success: 60,
      looseMe: -60,
      looseOthers: 27,
      strength: 16
    },
    "Abondance 10": {
      success: 42,
      looseMe: -42,
      looseOthers: 25,
      strength: 15
    },
    "Grande misère": {
      success: 36,
      looseMe: -36,
      looseOthers: 66,
      strength: 14
    },
    "Trou": {
      success: 16,
      looseMe: 0,
      looseOthers: 16,
      strength: 13
    },
    "Abondance 9": {
      success: 32,
      looseMe: -32,
      looseOthers: 21,
      strength: 12
    },
    "Piccolo": {
      success: 24,
      looseMe: -24,
      looseOthers: 16,
      strength: 10
    },
    "Petite misère": {
      success: 18,
      looseMe: -18,
      looseOthers: 12,
      strength: 7
    },
    "Solo": {
      success: 13,
      looseMe: -13,
      looseOthers: 13,
      strength: 3
    },
    "Emballage": {
      success: 7,
      looseMe: -7,
      looseOthers: 7,
      strength: 1
    },
    "Passer": {
      success: 0,
      looseMe: 0,
      looseOthers: 0,
      strength: 0
    }
  }

  this.players = {};
  var players = _.toArray(arguments);
  for (var i in players) {
    this.players[players[i]] = {
      carts: new Carts(this.pull(13)),
      announce: {
        name: undefined,
        symbol: undefined,
        level: undefined,
        canTalk: true // Seulement pour un joueur solo qui se fait emballer
      }
    }
    this.players[players[i]].carts.sort()
  }

  this.currentPlayer = Object.keys(this.players)[0];
  this.nextPlayer = function nextPlayer(player) {
    if (_.isUndefined(player)) var player = this.currentPlayer;
    var players = Object.keys(this.players);
    var index = players.indexOf(player);
    return players[index < 3 ? index + 1 : 0];
  }

  // FirstPlayerAnnounce, Announce, Play, End
  this.STATE_FIRSTPLAYERANNOUNCE = "FirstPlayerAnnounce";
  this.STATE_ANNOUNCE = "Announce";
  this.STATE_PLAY = "Play";
  this.STATE_END = "End";
  this.state = this.STATE_FIRSTPLAYERANNOUNCE;
  this.playTurn = function playTurn(player, message) {
    if (player === this.currentPlayer) {
      switch (this.state) {

        // Le premier joueur va annoncer
        case this.STATE_FIRSTPLAYERANNOUNCE:
          var allowedAnn = Object.keys(this.announces);
          allowedAnn.push("Premier") // Le premier peut annoncer... bah premier :)
          this.state = this.STATE_ANNOUNCE;
          // Pas de break, on veut gérer les annonces normalement

        // Annonces classiques
        case this.STATE_ANNOUNCE:
          // On vérifie que le joueur peut parler
          if (this.players[player].announce.canTalk) {
            if (typeof allowedAnn === "undefined") var allowedAnn = Object.keys(this.announces)

            // On vérifie que le message est valide pour une annonce
            if ("announce" in message && typeof message.announce === "string") {
              // On vérifie que l'annonce existe
              if (_.contains(allowedAnn, message.announce)) {
                if (_.isUndefined(this.players[player].announce.name) || this.players[player].announce.name !== "Passer") {
                  // On vérifie si on est le dernier à annoncer ou pas
                  var amITheLastOneToAnnounce = this.players[player].announce.name === "Premier" || (!_.isUndefined(this.players[this.nextPlayer()].announce.name) && this.players[this.nextPlayer()].announce.name !== "Premier");

                  // On regarde le type de l'annonce
                  switch (message.announce) {
                    case "Passer":
                      if (this.players[player].announce.name == "Emballage") {
                        var self = this;
                        var theOtherPlayer = _.chain(Object.keys(this.players).filter(function(p){return self.players[p].announce.symbol == self.players[player].announce.symbol})).without(player).first();
                        this.players[theOtherPlayer].announce.name = "Passer";
                        this.players[theOtherPlayer].announce.level = 0;
                        this.players[theOtherPlayer].announce.symbol = undefined;
                      }
                      this.players[player].announce.name = "Passer";
                      this.players[player].announce.level = 0;
                      this.players[player].announce.symbol = undefined;
                      break;
                    case "Solo":
                    case "Emballage":
                      // Dans le cas d'un solo ou d'en emballage, le joueur doit spécifier deux arguments supplémentaire:
                      // L'enchère de l'annonce (type number)
                      // Le symbole dans lequel il annonce (dont la valeur doit exister)
                      if ("announceLevel" in message && typeof message.announceLevel === "number" && "announceSymbol" in message && _.contains(this.symbols, message.announceSymbol)) {
                        // On vérifie que le joueur possède au moins une carte de ce symbole
                        if (_.contains(this.players[player].carts.carts.map(function(x){return x.symbol}), message.announceSymbol)) {
                          // On vérifie que le solo annoncé n'est pas un emballage ou inversemment
                          var self = this;
                          if (_.contains(Object.keys(this.players).map(function(p){return self.players[p].announce.symbol}), message.announceSymbol)) {
                            message.announce = "Emballage";
                          } else if (message.announce !== "Solo") throw("InvalidAnnounce Cannot follow a ghost")

                          // On sinde solo et emballage
                          if (message.announce == "Solo") {
                            // Tester si il y a un joueur après nous qui peut emballer (undefined ou premier)
                            // Tester la puissance de la carte
                            if (!amITheLastOneToAnnounce) {
                              if (_.isUndefined(this.players[player].announce.name) || this.player[player].announce.name === "Premier" || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength + message.announceLevel) {
                                this.players[player].announce.name = message.announce;
                                this.players[player].announce.level = message.announceLevel;
                                this.players[player].announce.symbol = message.announceSymbol;

                              } else {
                                throw "InvalidAnnounce Cannot announce less";
                              }
                            } else {
                              throw "InvalidAnnounce Last player cannot go solo";
                            }
                          } else {

                            // Tester qu'on a soit
                            // Un joueur en plus de moi-même qui est solo dans ce symbole
                            // Deux joueurs en tout dont moi-même qui ont emballé le même symbole
                            var playersWithSameSymboleAsAnnounced = Object.keys(this.players).filter(function(p){return self.players[p].announce.symbol == message.announceSymbol});
                            if (playersWithSameSymboleAsAnnounced.length === 1) {
                              // Tester qu'on ne change pas de symbole pour les emballages et en même temps qu'on ne change pas de type d'annonce
                              if (_.isUndefined(this.players[player].announce.name) || this.players[player].announce.name === "Premier" || this.players[player].announce.symbol === message.symbol) {
                                // Tester que l'annonce est plus forte que la précédente
                                if (_.isUndefined(this.players[player].announce.name) || this.players[player].announce.name === "Premier" || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength + message.announceLevel) {
                                  this.players[player].announce.name = message.announce;
                                  this.players[player].announce.level = message.announceLevel;
                                  this.players[player].announce.symbol = message.announceSymbol;

                                  this.players[playersWithSameSymboleAsAnnounced[0]].announce.name = message.announce;
                                  this.players[playersWithSameSymboleAsAnnounced[0]].announce.level = message.announceLevel;
                                  this.players[playersWithSameSymboleAsAnnounced[0]].announce.canTalk = false;
                                }
                                else {
                                  throw "InvalidAnnounce Cannot announce less"
                                }
                              } else {
                                throw "InvalidAnnounce Cannot change announced symbol";
                              }

                            } else if (playersWithSameSymboleAsAnnounced.length === 2 && _.contains(playersWithSameSymboleAsAnnounced, player)) {
                              // Tester qu'on ne change pas de symbole pour les emballages et en même temps qu'on ne change pas de type d'annonce
                              if (this.player[player].announce.symbol === message.symbol) {
                                // Tester que l'annonce est plus forte que la précédente
                                if (this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength + message.announceLevel) {
                                  this.players[player].announce.name = message.announce;
                                  this.players[player].announce.level = message.announceLevel;
                                  this.players[player].symbol = message.announceSymbol;

                                  var theOtherPlayer = playersWithSameSymboleAsAnnounced.filter(function(p){return p != player})[0]
                                  this.players[theOtherPlayer].announce.name = message.announce;
                                  this.players[theOtherPlayer].announce.level = message.announceLevel;
                                }
                                else {
                                  throw "InvalidAnnounce Cannot announce less";
                                }
                              } else {
                                throw "InvalidAnnounce Cannot change announced symbol";
                              }
                            } else {
                              throw "InvalidAnnounce Cannot follow a player already followed";
                            }
                          }
                        } else {
                          throw "InvalidAnnounce No cart of the following symbol: \"" + message.announceSymbol + "\" found in the carts of " + player;
                        }

                      } else {
                        throw "InvalidMessage Missing announceLevel (or wrong type) or announceSymbol (or wrong value): " + Object.keys(message).join(", ");
                      }
                      break;

                    // Toutes les autres annonces
                    default:
                      if (this.players[player].announce.name !== "Premier") {
                        if (_.isUndefined(this.players[player].announce.name) || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength) {
                          this.players[player].announce.name = message.announce;
                          this.players[player].announce.level = 0;
                          this.players[player].announce.symbol = undefined;
                          this.players[player].announce.canTalk = true;
                        } else {
                          throw "InvalidAnnounce Cannot announce less";
                        }
                      } else {
                        throw "InvalidAnnounce Premier can only announce \"Emballer\""
                      }
                  } // End Switch

                  // Si:
                  // - On a trois personnes qui ont passé && que le dernier a annoncé qqch (et donc qu'il gagne l'enchère)
                  // - On a deux joueurs qui ont l'annonce emballer et les deux derniers qui ont passé (et donc qu'ils gagnent l'enchère)
                  // Alors:
                  // - On donne la parole au premier
                  // - On lance la partie
                  // Sinon si:
                  // - Tout le monde a passé
                  // Alors:
                  // - On arrête le jeu
                  // Sinon:
                  // - On donne la parole au prochain joueur qui n'a pas encore passé et qui n'a pas annoncé le même symbol que nous

                  var self = this
                  var playersAnnounces = Object.keys(this.players).map(function(p){return self.players[p].announce.name});
                  if ( (playersAnnounces.filter(function(a){return a == "Passer"}).length === 3 && !_.isUndefined(playersAnnounces[3])) || (playersAnnounces.filter(function(a){return a == "Passer"}).length === 2 && playersAnnounces.filter(function(a){return a == "Emballage"}).length === 2) ) {
                    this.state = this.STATE_PLAY;
                    this.currentPlayer = Object.keys(players)[0];

                  } else if (playersAnnounces.filter(function(a){return a == "Passer"}).length === 4) {
                    this.state = this.STATE_END;

                  } else {

                    do {
                      this.currentPlayer = this.nextPlayer();
                    } while(this.players[this.currentPlayer].announce.name === "Passer" || !this.players[this.currentPlayer].announce.canTalk)
                  }

                } else {
                  throw "InvalidAnnounce Cannot announce after passed"
                }

              } else {
                throw "InvalidAnnounce Invalid Name";
              }

            } else {
              throw "InvalidMessage Missing announce (or wrong types)";
            }
          } else {
            throw "InvalidAnnounce Cannot Talk"
          }
        case this.STATE_PLAY:
        case this.STATE_END:
          break;
      }
    } else {
      throw "NotYourTurn"
    }
  }
}

module.exports.Whist = Whist;
