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

  this.contains = function contains(cart) {
    return _.contains(this.carts, cart)
  }
}

var getCartsFromString = function getCartsFromString(str) {
  var carts = [];
  var symbols = {"♥": "Heart", "♠": "Spade", "♦": "Diamond", "♣": "Club"};
  var names = {"2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Heigh", "9": "Nine", "10": "Ten","V": "Valet", "Q": "Queen", "K": "King","A": "As"};
  str = str.split(" ");

  for (var i = 0 in str) {
    if (str[i].length === 2) {
      var value = str[i][0]
      var symbol = str[i][1]
    } else {
      var value = str[i].slice(0, 2);
      var symbol = str[i][2]
    }
    carts.push({
      value: parseInt(Object.keys(names).indexOf(value) + 2),
      symbol: symbols[symbol],
      name: names[value],
      toString: function toString() {
        var symbols = {"Heart":"♥","Spade":"♠","Diamond":"♦","Club":"♣"};
        return "" + (this.value < 11 ? this.value : this.name[0]) + symbols[this.symbol];
      }
    });
  }
  return carts;
}

module.exports.Carts = Carts;
module.exports.getCartsFromString = getCartsFromString;
