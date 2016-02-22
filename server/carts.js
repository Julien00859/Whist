const _ = require("underscore");

// Create a deck with carts given or all carts
var Carts = function Carts(carts) {
  var self = this;
  this.symbols = ["Heart","Spade","Diamond","Club"]; // spades (♠), hearts (♥), diamonds (♦) and clubs (♣)
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
      return this.pull(this.carts.indexOf(cart), 1);
    } else {
      throw "CartNotFound";
    }
  }

  // Append one or many carts at the end
  this.add = function add(carts) {
    if (typeof carts == "Array") {
      this.carts.extend(carts)
    } else if (typeof carts == "Object") {
      this.carts.push(carts)
    }
  }

  // Sort the carts by symbol and then by number
  this.sort = function shuffle() {
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
}

var Whist = function Whist(player1, player2, player3, player4) {
  Carts.call(this);
  this.players = {};
  var players = _.toArray(arguments);
  for (var i in players) {
    this.players[players[i]] = {
      carts: new Carts(this.carts.pull(13)),
      announce: undefined,
      announceLvl: 0
    }
  }
  this.announces {
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
    "Pass": {
      success: 0,
      looseMe: 0,
      looseOthers: 0,
      strength: 0
    }
  }

  this.currentPlayer = Object.keys(this.players)[0];
  this.nextPlayer = function nextPlayer() {
      var players = Object.keys(this.players);
      var index = players.indexOf(this.currentPlayer);
      return players[index < 3 ? index + 1 : 0];
  }

  this.state = 0;
  this.play = function play(player, message) {
    if (player == this.listenTo) {
      switch (this.state) {
        // Annonces
        case 0:
            if ("announce" in message && typeof message.announce == "string") {
              if (message.announce] in this.announces) {
                if (message.announce == "Pass") {
                  this.players[player].announceLvl = 0;
                  this.players[player].announce = message.announce

                } else if (_.contains(["Solo","Emballage"], message.announce) && "announceLvl" in message && typeof message.announceLvl == "integer") {
                  if (message.announceLvl. > this.players[player].announceLvl) {
                    this.players[player].announceLvl = message.announceLvl;

                  } else {
                    throw "CannotAnnouncesLess"
                  }

                } else if (!(_.contains(["Solo","Emballage","Pass"], message.announce))) {
                  if (this.announces[message.announce].strength > this.announces[this.players[player].announce].strength + this.players[player].announceLvl) {
                    this.players[player].announceLvl = 0;
                    this.players[player].announce = message.announce

                  } else {
                    throw "CannotAnnouncesLess"
                  }

                } else {
                  throw "IncorrectMessage"
                }

              } else {
                throw "IncorrectAnnounce"
              }

            } else {
              throw "IncorrectMessage"
            }
            // Donner la parole au prochain qui a pas encore pass ou lancer la partie selon les annonces actuelles
          break;

      }
    } else {
      throw "NotYourTurn"
    }
  }
}
