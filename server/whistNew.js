const _ = require("underscore");
const cardsLib = require("./cards.js");

const STATE_ANNOUNCE = 1; // Le premier tour de table pour les annonces
const STATE_ANNOUNCE_AFTER_HOLE = 2; // Le premier tour de table pour les annonces sans celles qui sont plus fables que le trou
const STATE_BIDS = 3; // Les enchères
const STATE_RETRIEVE_CART = 4; // Si quelqu'un a annoncé petite misière et que tout le monde doit retirer une carte de son jeu
const STATE_PLAY = 5; // Le déroulement de la partie
const STATE_END = 6; // Lorsque le jeu est fini

var WhistError = function WhistError(message) {
   this.message = message;
   this.name = "WhistInternalException";
}

const ANNOUNCES = {
  "Grand chelem": {
    success: 200, // Si je réussi mon annonce, le nombre de points que je gagne
    looseMe: -200, // Si je rate mon annonce, le nombre de points que je perd
    winOthers: 66, // Si je rate mon annonce, le nombre de points que les autres gagnent
    folds: 13, // Le nombre de pli (minimum, maximum ou défini selon le type d'annonce)
    type: "Chelem", // Le type de l'annonce (Abondance, Misère, Trou, Solo, Emballage, Passer)
    next: undefined // Si on peut surenchérir dessus, alors vers quoi est-ce qu'on surenchéri
  },
  "Petit chelem": {
    success: 100, looseMe: -100, winOthers: 33,
    folds: 12,
    type: "Chelem",
    next: "Grand chelem"
  },
  "Grande misère étalée": {
    success: 75, looseMe: -75, winOthers: 32,
    folds: 0,
    type: "Misère"
  },
  "Abondance 11": {
    success: 60, looseMe: -60, winOthers: 27,
    folds: 11,
    type: "Abondance",
    next: "Petit chelem"
  },
  "Abondance 10": {
    success: 42, looseMe: -42, winOthers: 25,
    folds: 10,
    type: "Abondance",
    next: "Abondance 11"
  },
  "Grande misère": {
    success: 36, looseMe: -36, winOthers: 66,
    folds: 0,
    type: "Misère",
    next: "Grande misère étalée"
  },
  "Trou": {
    success: 16, looseMe: 0, winOthers: 16,
    folds: 9,
    type: "Trou"
  },
  "Bouche-trou": {
    success: 16, looseMe: 0, winOthers: 16,
    folds: 9,
    type: "Trou"
  },
  "Abondance 9": {
    success: 32, looseMe: -32, winOthers: 21,
    folds: 9,
    type: "Abondance",
    next: "Abondance 10"
  },
  "Emballage 13": {
    success: 30, looseMe: -30, winOthers: 30,
    folds: 13,
    type: "Emballage",
    next: undefined
  },
  "Piccolo": {
    success: 24, looseMe: -24, winOthers: 16,
    folds: 1,
    type: "Piccolo",
    next: "Grande misère"
  },
  "Solo 8": {
    success: 21, looseMe: -24, winOthers: 16,
    folds: 8,
    type: "Solo",
    next: undefined
  },
  "Emballage 12": {
    success: 19, looseMe: -22, winOthers: 22,
    folds: 12,
    type: "Emballage",
    next: "Emballage 13"
  },
  "Petite misère": {
    success: 18, looseMe: -18, winOthers: 12,
    folds: 0,
    type: "Misère",
    next: "Grande misère"
  },
  "Emballage 11": {
    success: 16, looseMe: -19, winOthers: 19,
    folds: 11,
    type: "Emballage",
    next: "Emballage 12"
  },
  "Solo 7": {
    success: 15, looseMe: -18, winOthers: 12,
    folds: 7,
    type: "Solo",
    next: "Solo 8"
  },
  "Emballage 10": {
    success: 13, looseMe: -16, winOthers: 16,
    folds: 10,
    type: "Emballage",
    next: "Emballage 11"
  },
  "Solo 6": {
    success: 12, looseMe: -15, winOthers: 10,
    folds: 6,
    type: "Solo",
    next: "Solo 7"
  },
  "Emballage 9": {
    success: 10, looseMe: -13, winOthers: 13,
    folds: 9,
    type: "Emballage",
    next: "Emballage 10"
  },
  "Emballage 8": {
    success: 7, looseMe: -10, winOthers: 10,
    folds: 8,
    type: "Emballage",
    next: "Emballage 9"
  },
  "Premier": {
    type: "Passer"
  },
  "Passer": {
    type: "Passer"
  }
}

// Classe représentant une partie de Whist selon les rêgles de Julien et Nico
var Whist = function Whist(players) {

  // Création la mapping des joueurs et de la liste des joueurs
  if (players.length === 4 ) {
    this.players = {};
    this.playersList = [];

    for (var pl of players) {
      this.players[pl] = {score: 0}
      this.playersList.push(pl);
    }

    return this.newNormalGame();
  } else {
    throw new Error("La partie ne peut pas se lancer sans avoir 4 joueurs");
  }
};

Whist.prototype.newNormalGame = function newNormalGame() {
  // Réinisialitation des structures internes pour préparer une nouvelle partie
  this.resetGame();

  // Génération d'un jeu de carte, qu'on mélance et qu'on distribue aux joueurs
  var cards = new cardsLib.Cards();
  cards.shuffle();
  for (var pl of this.playersList) {
    this.players[pl].cards = new cardsLib.Cards(cards.pull(13));
    this.players[pl].cards.sort();
  }

  var playerWith3As = this.checkForHole();
  if (!_.isNull(playerWith3As)) {
    // Détection d'un trou
    this.state = STATE_ANNOUNCE_AFTER_HOLE;

    this.players[playerWith3As].announce.name = "Trou";

    // Recherche du bouche-trou
    for (var playerWith1As of _.without(this.playersList, playerWith3As)) {
      if (this.has1As(playerWith1As)) {
        this.players[playerWith1As].announce.name = "Bouche-trou";
        this.players[playerWith1As].announce.myFriend = playerWith3As;
        this.players[playerWith3As].announce.myFriend = playerWith1As;
        break;
      }
    }
  } else {
    // Pas de trou
    this.state = STATE_ANNOUNCE;
  }
  return this.state;
}

Whist.prototype.resetGame = function resetGame() {
  // Reset la mapping game
  this.game = {
    folds: [],
    turn: 1,
    trump: undefined
  }

  for (var pl in this.players) {
    // Reset la mapping des joueurs
    this.players[pl].announce = {
      name: undefined,
      symbol: undefined,
      canTalk: undefined,
      wasSolo: undefined,
      myFriend: undefined
    }
    this.players[pl].folds = undefined;
    this.players[pl].cards = undefined;
  }

  // Reset de l'état du jeu
  this.state = undefined;

  // Reset du joueur courant
  this.currentPlayer = undefined;
}

// Retourne le premier joueur ayant 3 as dans son jeu, sinon retourne null
Whist.prototype.checkForHole = function checkForHole() {
  for (var pl of this.playersList) if (this.players[pl].cards.cards.filter(function(c){return c.name === "As"}).length === 3) return pl;
  return null;
}

// Regarde si le joueur a exactement 1 as dans son jeu
Whist.prototype.has1As = function has1As(pl) {
  return (this.players[pl].cards.cards.filter(function(c){return c.name === "As"}).length === 1)
}

// Récupère le prochain joueur dans l'ordre chronologique
Whist.prototype.getNextPlayer = function getNextPlayer() {
  return this.playersList.indexOf(this.currentPlayer) == 3 ? this.playersList[0] : this.playersList[this.playersList.indexOf(this.currentPlayer) + 1]
}

// Récupère le premier joueur à ne pas avoir annoncé, ou celui qui a l'annonce la plus faible
Whist.prototype.getNextPlayerFollowingAnnounces = function getNextPlayerFollowingAnnounces() {
  var self = this;

  // Récupère le premier dont l'annonce est indéfinie
  var notAnnouncedYet = _.chain(self.playersList).filter(function(pl){
    return _.isUndefined(self.players[pl].announce.name)
  }).first().value();

  // Si on a trouvé une personne, on la retourne
  if (!_.isUndefined(notAnnouncedYet)) return notAnnouncedYet;

  // Sinon on retourne celui qui a l'annonce la plus faible
  return _.chain(self.playersList).filter(function(pl){
    return self.players[pl].announce.name !== "Passer" && self.players[pl].announce.canTalk
  }).sortBy(function(pl){
    var announceStrength = Object.keys(ANNOUNCES).reverse().indexOf(self.players[pl].announce.name);
    var symbolStrength = (self.players[pl].announce.symbol) ? cardsLib.symbols.slice().reverse().indexOf(self.players[pl].announce.symbol) / 4 : 0
    return announceStrength + symbolStrength;
  }).first().value();
}

Whist.prototype.getAvailableAnnounces = function getAvailableAnnounces() {
  var self = this;
  var availableAnnounces = [];
  var announcesList = Object.keys(ANNOUNCES)
  var symbols = cardsLib.symbols.slice().reverse();
  var others = _.without(this.playersList, this.currentPlayer);

  switch (this.state) {
    case STATE_ANNOUNCE:
      // Si on est le premier à annoncer, notre l'annonce "Passer" et change en "Premier"
      if (this.currentPlayer == this.playersList[0] && _.isUndefined(this.players[this.currentPlayer].announce.name)) availableAnnounces.push("Premier");
      else availableAnnounces.push("Passer");

      // Pour pouvoir annoncer Solo, il doit exister au moins un joueur pouvant m'emballer
      if (_.filter(others, function(pl){
        return _.isUndefined(self.players[pl].announce.name) || self.players[pl].announce.name == "Premier" || self.players[pl].announce.name == "Solo 6";
      }).length > 0) availableAnnounces.push("Solo 6");

      // Pour pouvoir emballer, il doit exister au moins un joueur ayant annoncé Solo
      if (_.filter(others, function(pl){return self.players[pl].announce.name == "Solo 6"}).length > 0) availableAnnounces.push("Emballage 8");

      availableAnnounces.push("Petite misère");
      availableAnnounces.push("Piccolo");
      availableAnnounces.push("Abondance 9");

      // Toutes les annonces supérieures au Trou
      availableAnnounces = availableAnnounces.concat(_.filter(announcesList, function(ann){return announcesList.indexOf(ann) < announcesList.indexOf("Trou")}).reverse())
      break;

    case STATE_ANNOUNCE_AFTER_HOLE:
      availableAnnounces.push("Passer");
      // Toutes les annonces supérieures ou égales au Bouche-trou
      availableAnnounces = availableAnnounces.concat(_.filter(Object.keys(ANNOUNCES), function(ann){return announcesList.indexOf(ann) <= announcesList.indexOf("Bouche-trou")}.reverse()));
      break;

    case STATE_BIDS:
      if (_.filter(others, function(pl){return this.players[pl].announce.name == "Solo 6"}).length > 0) availableAnnounces.push("Emballer");
      availableAnnounces.push("Encherir");
      availableAnnounces.push("Passer");
      break;

  }
  return availableAnnounces;
};

Whist.prototype.play = function(player, arg1, arg2, arg3) {
  if (this.currentPlayer == player) {
    switch (this.state) {
      case STATE_ANNOUNCE:
      case STATE_ANNOUNCE_AFTER_HOLE:
        var announce = arg1;
        var symbol = arg2;
        if (typeof announce == "string") { // L'annonce doit être définie et de type string
          if (announce in ANNOUNCES) { // L'annonce doit exister
            if (_.contains(this.getAvailableAnnounces(), announce)) { // L'annonce doit être valide dans le contexte actuel
              if (_.contains(["Solo", "Emballage", "Abondance"], ANNOUNCES[announce].type)) { // Si l'annonce doit être accompagné d'un symbol
                if (typeof symbol == "string") { // Le symbol doit être défini et de type string
                  if (_.contains(cardsLib.symbols, symbol)) { // Le symbol doit exister
                    // Appel de la fonction
                  } else throw new WhistError("Le symbole n'existe pas");
                } else throw new WhistError("Le symbole doit être défini et de type string");
              } else {
                // Appel de la fonction
              }
            } else throw new WhistError("L'annonce n'est pas valide dans le contexte actuel");
          } else throw new WhistError("L'annonce n'existe pas");
        } else throw new WhistError("L'annonce doit être définie et de type string");
        break;

      case STATE_BIDS:
        var bid = arg1;
        var symbol = arg2;
        if (typeof bid == "string") {
          if (_.contains(this.getAvailableAnnounces(), bid)) {
            if (bid == "Emballer") {
              if (typeof symbol == "string") {
                if (_.contains(cardsLib.symbols, symbol)) {
                  // Appel de la fonction
                } else throw new WhistError("Le symbole n'existe pas");
              } else throw new WhistError("Le symbole doit être défini et de type string");
            } else {
              // Appel de la fonction
            }
          } else throw new WhistError("L'enchère n'est pas valide dans le contexte actuel");
        } else throw new WhistError("L'enchère doit être définie et de type string");
        break;

      case STATE_RETRIEVE_CART:
      case STATE_PLAY:
        if (typeof card == "string") {
          try {
            var card = getCardsFromString(arg1);
          } catch(err) {
            throw new WhistError("Impossible de convertir la chaine en carte");
          } finally {
            if (card instanceof cardsLib.Card) {
              if (this.state == STATE_RETRIEVE_CART) {
                // Appel de la fonction
              } else {
                // Appel de la fonction
              }
            } else throw new WhistError("La chaine envoyée ne peut pas représenter une carte");
          }
        } else throw new WhistError("La carte doit être définie et de type string");
        break;

      case STATE_END:
        throw new WhistError("La partie est terminée");

      default:
        throw new Error("État du jeu inconnu");
    }
  } else {
    throw new WhistError("Ce n'est pas à ton tour de jouer");
  }
}

module.exports.Whist = Whist;
module.exports.WhistError = WhistError;
