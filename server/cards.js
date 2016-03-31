const _ = require("underscore");

var symbols = ["Heart","Diamond","Club","Spade"];
var names = ["Two","Three","Four","Five","Six","Seven","Heigh","Nine","Ten","Valet","Queen","King","As"];

var Card = function Card(symbol, name) {
  if (_.contains(symbols, symbol) && _.contains(names, name)) {
    this.value = names.indexOf(name) + 2;
    this.name = name;
    this.symbol = symbol;
  } else {
    throw "Unknown card " + symbol + " " + name;
  }
}
Card.prototype.toString = function toString() {
  var symbols = {"Heart":"♥","Spade":"♠","Diamond":"♦","Club":"♣"};
  return symbols[this.symbol] + (this.value < 11 ? this.value : this.name[0]);
}


// Create a deck with cards given or all cards
var Cards = function Cards(cards) {
  if (typeof cards != "undefined") {
    this.cards = _.toArray(cards);
  } else {
    this.cards = [];
    for (var s in symbols) {
      for (var n in names) {
        this.cards.push(new Card(symbols[s], names[n]));
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
  for (var c in this.cards) if (_.isMatch(this.cards[c], card)) return this.cards.splice(c, 1)[0];
  throw "CardNotFound";
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
  this.cards.sort(function(cardA, cardB) {
    if (cardA.symbol != cardB.symbol) {
      return symbols.indexOf(cardA.symbol) - symbols.indexOf(cardB.symbol);
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
  return _.any(this.cards, function(c){return _.isMatch(c, card)});
}

var getCardsFromString = function getCardsFromString(str) {
  var cards = [];
  var symbols = {"♥": "Heart", "♠": "Spade", "♦": "Diamond", "♣": "Club"};
  var names = {"2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Heigh", "9": "Nine", "10": "Ten","V": "Valet", "Q": "Queen", "K": "King","A": "As"};
  var value;
  str = str.split(" ");

  for (var i in str) {
    if (str[i][0] in symbols && str[i].slice(1) in names) cards.push(new Card(symbols[str[i][0]], names[str[i].slice(1)]));
    else throw new Error("ParseError");
  }
  return cards.length > 1 ? cards : cards[0];
}

module.exports.Cards = Cards;
module.exports.Card = Card;
module.exports.getCardsFromString = getCardsFromString;
module.exports.symbols = symbols;
module.exports.names = names;
