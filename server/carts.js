const _ = require("underscore");

// Create a deck with carts given or all carts
var Carts = function Carts(carts) {
  var self = this;
  this.symbols = ["Heart","Diamond","Club","Spade"]; // spades (♠), hearts (♥), diamonds (♦) and clubs (♣)
  this.values = ["Two","Three","Four","Five","Six","Seven","Heigh","Nine","Ten","Valet","Queen","King","As"];

  if (typeof carts != "undefined") {
    this.carts = _.toArray(carts);
  } else {
    this.carts = [];
    for (var s = 0 in this.symbols) {
      for (var n = 0 in this.values) {
        this.carts.push({
          value: (+n)+2,
          symbol: this.symbols[s],
          name: this.values[n],
          toString: function toString() {
            var symbol = {"Heart":"♥","Spade":"♠","Diamond":"♦","Club":"♣"};
            return (this.value < 11 ? this.value : this.name[0]) + symbol[this.symbol];
          }
        });
      }
    }
  }

  // Pull n carts from the up or n carts at the i position
  this.pull = function pull(i, n) {
    if (typeof n == "undefined") {
      var n = i
      i = 0;
    }
    if (i+n <= this.carts.length) {
      return this.carts.splice(i, n);
    } else {
      throw "NoEnoughCart"
    }
  }

  // Get the given cart from the deck
  this.get = function get(cart) {
    if (_.contains(this.carts, cart)) {
      return this.pull(this.carts.indexOf(cart), 1)[0];
    } else {
      throw "CartNotFound";
    }
  }

  // Append one or many carts at the end
  this.add = function add(carts) {
    if (_.isArray(carts)) {
      this.carts = this.carts.concat(carts)
    } else if (_.isObject(carts)) {
      this.carts.push(carts)
    } else {
      throw "InvalidType"
    }
  }

  // Sort the carts by symbol and then by number
  this.sort = function sort() {
    self.carts.sort(function(cartA, cartB) {
      if (cartA.symbol != cartB.symbol) {
        return self.symbols.indexOf(cartA.symbol) - self.symbols.indexOf(cartB.symbol);
      } else {
        return cartB.value - cartA.value;
      }
    });
  }

  // Shuffle carts
  this.shuffle = function shuffle() {
    this.carts = _.shuffle(this.carts);
  }

  // Get the length of the deck
  this.getLength = function getLength() {
    return this.carts.length
  }

  // Retrieve carts following their symbol or value
  this.skip = function skip(symbol, value) {
    for (var n in this.carts.length) {
      if (_.contains(symbol, this.carts[n].symbol) || _.contains(value, this.carts[n].symbol)) {
        this.get(this.carts[n]);
      }
    }
  }

  this.toString = function toString() {
    var carts = [];
    for (var cart in this.carts) {
      carts.push(this.carts[cart].toString())
    }
    return carts.join(" ");
  }
}

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
  this.nextPlayer = function nextPlayer() {
      var players = Object.keys(this.players);
      var index = players.indexOf(this.currentPlayer);
      return players[index < 3 ? index + 1 : 0];
  }

  // FirstPlayerAnnounces, Announces
  this.state = "FirstPlayerAnnounces";
  this.playTurn = function playTurn(player, message) {
    if (player === this.currentPlayer) {
      switch (this.state) {

        // Le premier joueur va annoncer
        case "FirstPlayerAnnounces":
          var allowedAnn = Object.keys(this.announces);
          allowedAnn.push("Premier") // Le premier peut annoncer... bah premier :)
          this.state = "Announces"
          // Pas de break, on veut gérer les annonces normalement

        // Annonces classiques
        case "Announces":
          if (typeof allowedAnn === "undefined") var allowedAnn = Object.keys(this.announces)

          // On vérifie que le message est valide pour une annonce
          if ("announce" in message && typeof message.announce === "string") {
            // On vérifie que l'annonce existe
            if (_.contains(allowedAnn, message.announce)) {

              // On vérifie si on est le dernier à annoncer ou pas
              var amITheLastOneToAnnounce = this.players[player].announce.name === "Premier" || (typeof this.players[this.nextPlayer()].announce.name !== "undefined" && this.players[this.nextPlayer()].announce.name !== "Premier");

              // On regarde le type de l'annonce
              switch (message.announce) {
                case "Passer":
                  if (this.players[player].announce == "Emballage") {
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

                      } else if (!(_.contains(Object.keys(this.players).map(function(p){return self.players[p].announce.symbol}), message.announceSymbol))) {
                        message.announce = "Solo";
                      }

                      // On sinde solo et emballage
                      if (message.announce == "Solo") {
                        // Tester si il y a un joueur après nous qui peut emballer (undefined ou premier)
                        // Tester la puissance de la carte
                        if (!amITheLastOneToAnnounce) {
                          if (typeof this.players[player].announce.name === "undefined" || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength + message.announceLevel) {
                            this.players[player].announce.name = message.announce;
                            this.players[player].announce.level = message.announceLevel;
                            this.players[player].symbol = message.announceSymbol;

                          } else {
                            throw "InvalidAnnounce Cannot announce less";
                          }
                        } else {
                          throw "InvalidAnnounce Last player cannot go solo";
                        }
                      } else {
                        // Tester qu'on a l'autorisation de parler.
                        if (this.players[player].announce.canTalk) {

                          // Tester qu'on a soit
                          // Un joueur en plus de moi-même qui est solo dans ce symbole
                          // Deux joueurs en tout dont moi-même qui ont emballé le même symbole
                          var playersWithSameSymboleAsMe = Object.keys(this.players).filter(function(p){return self.players[p].announce.symbol == message.announceSymbol});
                          if (playersWithSameSymboleAsMe.length === 1) {
                            // Tester qu'on ne change pas de symbole pour les emballages et en même temps qu'on ne change pas de type d'annonce
                            if (typeof this.players[player].announce.name === "undefined" || this.player[player].announce.symbol === message.symbol) {
                              // Tester que l'annonce est plus forte que la précédente
                              if (typeof this.player[player].announce.name === "undefined" || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength + message.announceLevel) {
                                this.players[player].announce.name = message.announce;
                                this.players[player].announce.level = message.announceLevel;
                                this.players[player].symbol = message.announceSymbol;

                                // playersWithSameSymboleAsMe[0] contient le nom de l'autre joueur
                                this.players[playersWithSameSymboleAsMe[0]].announce.name = message.announce;
                                this.players[playersWithSameSymboleAsMe[0]].announce.level = message.announceLevel;
                                this.players[playersWithSameSymboleAsMe[0]].symbol = message.announceSymbol;
                                this.players[playersWithSameSymboleAsMe[0]].canTalk = false;
                              }
                              else {
                                throw "InvalidAnnounce Cannot announce less"
                              }
                            } else {
                              throw "InvalidAnnounce Cannot change announced symbol";
                            }

                          } else if (playersWithSameSymboleAsMe.length === 2 && _.contains(playersWithSameSymboleAsMe, player)) {
                            // Tester qu'on ne change pas de symbole pour les emballages et en même temps qu'on ne change pas de type d'annonce
                            if (typeof this.players[player].announce.name === "undefined" || this.player[player].announce.symbol === message.symbol) {
                              // Tester que l'annonce est plus forte que la précédente
                              if (typeof this.player[player].announce.name === "undefined" || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength + message.announceLevel) {
                                this.players[player].announce.name = message.announce;
                                this.players[player].announce.level = message.announceLevel;
                                this.players[player].symbol = message.announceSymbol;

                                var theOtherPlayer = playersWithSameSymboleAsMe.filter(function(p){return p != player})[0]
                                this.players[theOtherPlayer].announce.name = message.announce;
                                this.players[theOtherPlayer].announce.level = message.announceLevel;
                                this.players[theOtherPlayer].symbol = message.announceSymbol;
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
                        } else {
                          throw "InvalidAnnounce Cannot Talk"
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
                    if (typeof this.players[player].announce.name === "undefined" || this.announces[this.players[player].announce.name].strength + this.players[player].announce.level < this.announces[message.announce].strength) {
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

              // Vérifier si il reste soit
              // Des joueurs n'ayant encore rien dit
              // Un joueur qui a annoncé premier
              // Personne... stopper la partie car tout le monde a passé

            } else {
              throw "InvalidAnnounce Invalid Name";
            }

          } else {
            throw "InvalidMessage Missing announce (or wrong types): " + Object.keys(message).join(", ");
          }
      }
    } else {
      throw "NotYourTurn"
    }
  }
}

module.exports.Carts = Carts;
module.exports.Whist = Whist;
