const _ = require("underscore");

var symbols = ["Heart","Diamond","Club","Spade"];
var names = ["Two","Three","Four","Five","Six","Seven","Heigh","Nine","Ten","Valet","Queen","King","As"];

// Create a deck with cards given or all cards
var Cards = function Cards(cards) {
  var self = this;
  if (typeof cards != "undefined") {
    this.cards = _.toArray(cards);
  } else {
    this.cards = [];
    for (var s = 0 in symbols) {
      for (var n = 0 in values) {
        this.cards.push({
          value: (+n)+2,
          symbol: symbols[s],
          name: values[n],
          toString: function toString() {
            var symbol = {"Heart":"♥","Spade":"♠","Diamond":"♦","Club":"♣"};
            return (this.value < 11 ? this.value : this.name[0]) + symbol[this.symbol];
          }
        });
      }
    }
  }
}

// Pull n cards from the up or n cards at the i position
Cards.prototype.pull = function pull(i, n) {
  if (typeof n == "undefined") {
    var n = i
    i = 0;
  }
  if (i+n <= this.cards.length) {
    return this.cards.splice(i, n);
  } else {
    throw "NoEnoughCard"
  }
}

// Get the given card from the deck
Cards.prototype.get = function get(card) {
  if (_.contains(this.cards, card)) {
    return this.pull(this.cards.indexOf(card), 1)[0];
  } else {
    throw "CardNotFound";
  }
}

  // Append one or many cards at the end
Cards.prototype.add = function add(cards) {
  if (_.isArray(cards)) {
    this.cards = this.cards.concat(cards)
  } else if (_.isObject(cards)) {
    this.cards.push(cards)
  } else {
    throw "InvalidType"
  }
}

// Sort the cards by symbol and then by number
Cards.prototype.sort = function sort() {
  self.cards.sort(function(cardA, cardB) {
    if (cardA.symbol != cardB.symbol) {
      return self.symbols.indexOf(cardA.symbol) - self.symbols.indexOf(cardB.symbol);
    } else {
      return cardB.value - cardA.value;
    }
  });
}

// Shuffle cards
Cards.prototype.shuffle = function shuffle() {
  this.cards = _.shuffle(this.cards);
}

// Get the length of the deck
Cards.prototype.getLength = function getLength() {
  return this.cards.length
}

// Retrieve cards following their symbol or value
Cards.prototype.skip = function skip(symbol, value) {
  for (var n in this.cards.length) {
    if (_.contains(symbol, this.cards[n].symbol) || _.contains(value, this.cards[n].symbol)) {
      this.get(this.cards[n]);
    }
  }
}

Cards.prototype.toString = function toString() {
  var cards = [];
  for (var card in this.cards) {
    cards.push(this.cards[card].toString())
  }
  return cards.join(" ");
}

Cards.prototype.contains = function contains(card) {
  return _.contains(this.cards, card)
}

var getCardsFromString = function getCardsFromString(str) {
  var cards = [];
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
    cards.push({
      value: parseInt(Object.keys(names).indexOf(value) + 2),
      symbol: symbols[symbol],
      name: names[value],
      toString: function toString() {
        var symbols = {"Heart":"♥","Spade":"♠","Diamond":"♦","Club":"♣"};
        return "" + (this.value < 11 ? this.value : this.name[0]) + symbols[this.symbol];
      }
    });
  }
  return cards;
}

module.exports.Cards = Cards;
module.exports.getCardsFromString = getCardsFromString;
module.exports.symbols = symbols;
module.exports.names = names;
