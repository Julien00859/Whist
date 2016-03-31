const _ = require("underscore");
const cardsLib = require("./cards.js");

const STATE_ANNOUNCE = 1; // Le premier tour de table pour les annonces
const STATE_ANNOUNCE_AFTER_HOLE = 2; // Le premier tour de table pour les annonces sans celles qui sont plus fables que le trou
const STATE_BIDS = 3; // Les enchères
const STATE_RETRIEVE_CART = 4; // Si quelqu'un a annoncé petite misière et que tout le monde doit retirer une carte de son jeu
const STATE_PLAY = 5; // Le déroulement de la partie
const STATE_END = 6; // Lorsque le jeu est fini

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
  "Passer": {
    type: "Passer"
  }
}

// Classe représentant une partie de Whist selon les rêgles de Julien et Nico
var Whist = function Whist(players) {

  this.id = _.uniqueId();

  // Crée la mapping des joueurs
  if (players.length === 4 ) {
    this.players = {};
    for (var pl of players) {
      this.players[pl] = {
        announce: {
          name: undefined, // Le nom de l'annonce
          symbol: undefined, // Si on annonce Solo ou Emballage, le symbole de l'annonce
          canTalk: true, // Celui qui peut parler durant un emballage
          wasSolo: undefined, //  Passe à true si un joueur se fait emballer, passe à false si on emballe quelqu'un
          myFriend: undefined // Le nom de notre allié pour les emballages et le trou
        },
        folds: [], // Les plis que le joueur a réalisé
        score: 0 // Les points du joueur
      }
    }
  } else {
    throw new Error("La partie ne peut pas se lancer sans avoir 4 joueurs");
  }

  this.game = {
    folds: [], // La liste des plis joués
    turn: 1, // Le numéro du tour
    trump: undefined // L'atout de la partie
  }
  this.newNormalGame()
};

// Initialise une nouvelle partie sans toucher aux points
Whist.prototype.reset = function reset() {
  // Reset la mapping game
  this.game.folds = [];
  this.game.turn = 1;
  this.game.trump = undefined;

  for (var pl in this.players) {
    // Reset la mapping des joueurs
    this.players[pl].announce.name = undefined;
    this.players[pl].announce.symbol = undefined;
    this.players[pl].announce.canTalk = true;
    this.players[pl].announce.wasSolo = undefined;
    this.players[pl].announce.myFriend = undefined;
    this.players[pl].announce.folds = undefined;
    this.players[pl].folds = undefined;
    this.players[pl].cards = undefined;
  }

  // Reset de l'état du jeu
  this.state = undefined;

  // Reset du joueur courant
  this.currentPlayer = undefined;
}

// Débute une nouvelle partie en distribuant les cartes
Whist.prototype.newNormalGame = function newNormalGame(player) {
  // Génération d'un jeu de carte qu'on mélange
  var cards = new cardsLib.Cards();
  cards.shuffle();


  for (var pl of Object.keys(this.players)) {
    // Distribue 13 cartes à chaque joueur et trie son jeu
    this.players[pl].cards = new cardsLib.Cards(cards.pull(13))
    this.players[pl].cards.sort()
  }

  // Si il y a un trou, on récupère son nom
  var hole = this.checkForHole();
  if (!_.isUndefined(hole)) {
    this.players[hole].announce.name = "Trou"; // On force son annonce à être trou
    this.state = STATE_ANNOUNCE_AFTER_HOLE; // Gestion spécial des annonces

    // On va chercher celui qui a le dernier As
    for (var pl of _.without(Object.keys(this.players), hole)) {
      var self = this;
      if (this.isDick(pl)) {
        this.players[pl].announce.name = "Bouche-trou"; // On force son annonce à être Bouche-trou
        this.players[hole].announce.myFriend = pl;
        this.players[pl].announce.myFriend = hole;
      }
    }
    // On trouve le premier qui n'a pas parlé pour lui donner la parole
    var pl = Object.keys(this.players)[0];
    while (!_.isUndefined(this.players[pl].announce.name)) pl = this.nextPlayer(pl);
    this.currentPlayer = pl;
  } else {
    // Il n'y a pas eu trou
    this.state = STATE_ANNOUNCE;
    this.currentPlayer = Object.keys(this.players)[0];
  }
};

// Méthode de gestion de l'état du jeu, elle vérifie les arguments passés et active les fonctions dédiées
Whist.prototype.playTurn = function playTurn(player, message) {
  // Uniquement le joueur courant peut parler et jouer
  if (player === this.currentPlayer) {
    if (arguments.length === 2) {
      if (_.isObject(message)) {
        // On selectionne l'état actuel du jeu
        switch (this.state) {
          case STATE_ANNOUNCE:
            // On récupère la liste des type d'annonce sans le Trou
            var availableAnnounces = _.without(_.uniq(Object.keys(ANNOUNCES).map(function(ann){return ANNOUNCES[ann].type})), "Trou");
            if (player === Object.keys(this.players)[0] && _.isUndefined(this.players[player].announce.name)) availableAnnounces.push("Premier"); // Le premier pourra annoncer Premier
            // Pas de break

          case STATE_ANNOUNCE_AFTER_HOLE:
            // Récupère la liste d'annonce sans le Solo et l'Emballage (qui sont trop faibles pour battre le trou)
            if (_.isUndefined(availableAnnounces)) var availableAnnounces = _.uniq(Object.keys(ANNOUNCES).filter(function(ann){return ANNOUNCES[ann].type !== "Solo" && ANNOUNCES[ann].type !== "Emballage" && ANNOUNCES[ann].type !== "Piccolo" && ann != "Petite misère"}));

            if ("announce" in message) {
              if (_.contains(availableAnnounces, message.announce)) {
                this.dealWithAnnounce(message);
                this.announceGetNextPlayerAndMaybeChangeState();

              } else {
                throw new Error("L'annonce n'existe pas");
              }

            } else {
              throw new Error("La clef 'announce' est absente du message");
            }
            break; // End STATE_ANNOUNCE

          case STATE_BIDS:
            // On peut emballer plus fort, enchérir, passer
            if ("bid" in message) {
              if (_.contains(["Emballer", "Encherir", "Passer"], message.bid)) {
                this.dealWithBids(message);
                this.bidsGetNextPlayerAndMaybeChangeState();
              } else {
                throw new Error("L'enchère n'existe pas");
              }

            } else {
              throw new Error("La clef 'bid' est absente du message");
            }
            break;

          case STATE_PLAY:
            if ("card" in message) {
              this.dealWithCardPlayed(Cards.getCardsFromString(message.card));
              this.dealWithTurns();
            } else {
              throw new Error("La clef 'card' est absente du message");
            }

          case STATE_END:
            break;

          default:
            throw new Error("La partie n'est pas initialisé ou est dans un état inconnu.");

        }
      } else {
        throw new Error("Le second argument doit être un objet")
      }
    } else {
      throw new Error("Il doit y avoir deux arguments")
    }
  } else {
    throw new Error("Ce n'est pas au tour du joueur donné");
  }
}

Whist.prototype.nextPlayer = function nextPlayer(player) {
  if (_.isUndefined(player)) var player = this.currentPlayer;
  var players = Object.keys(this.players);
  var index = players.indexOf(player);
  return players[index < 3 ? index + 1 : 0];
};

Whist.prototype.dealWithAnnounce = function dealWithAnnounce(message) {
  switch (message.announce) {
    case "Solo":
    case "Emballage":
    case "Abondance":
      // Il y a atoux, donc il doit y avoir la couleur en plus du type d'annonce
      if ("announceSymbol" in message) {
        if (_.contains(cardsLib.symbols, message.announceSymbol)) {
          if (_.any(this.players[this.currentPlayer].cards.cards, function(c){return c.symbol === message.announceSymbol})) {
            // On re-switch pour séparer les trois
            switch (message.announce) {
              case "Solo":
                // On vérifie que personne n'avait annoncé ça avant
                var self = this;
                if (Object.keys(this.players).filter(function(pl){return self.players[pl].announce.symbol === message.announceSymbol}).length === 0) {
                  // Il faudrait vérifier que Si on est le dernier à annoncer et qu'on a la couleur
                  this.players[this.currentPlayer].announce.name = "Solo 6";
                  this.players[this.currentPlayer].announce.symbol = message.announceSymbol;

                } else {
                  throw new Error("Le symbole avait déjà été annoncé");
                }
                break;

              case "Emballage":
                var self = this;
                // On vérifie qu'un et un seul joueur avait déjà annoncé cette couleur avant
                var others = Object.keys(this.players).filter(function(pl){return self.players[pl].announce.symbol === message.announceSymbol});
                if (others.length === 1) {
                  this.players[this.currentPlayer].announce.name = "Emballage 8";
                  this.players[this.currentPlayer].announce.symbol = message.announceSymbol;
                  this.players[this.currentPlayer].announce.wasSolo = false;
                  this.players[this.currentPlayer].announce.myFriend = others[0];

                  this.players[others[0]].announce.name = "Emballage 8";
                  this.players[others[0]].announce.canTalk = false;
                  this.players[others[0]].announce.wasSolo = true;
                  this.players[others[0]].announce.myFriend = this.currentPlayer;

                } else {
                  throw new Error("Le symbole n'avait pas encore été annoncé");
                }
                break;

              case "Abondance":
                this.players[this.currentPlayer].announce.name = "Abondance 9";
                this.players[this.currentPlayer].announce.symbol = message.announceSymbol;
                break;

              case "Trou":
                // Pour garder l'annonce, que ce soit trou ou bouche-trou
                if (this.players[this.currentPlayer].announce.name !== "Trou" && this.players[this.currentPlayer].announce.name !== "Bouche-trou") {
                  throw new Error("On ne peut pas annoncer Trou, on l'est ou on ne l'est pas");
                }
                break;
            }
          } else {
            throw new Error("Le joueur doit posséder au moins une carte du symbole annoncé");
          }

        } else {
          throw new Error("Le symbole n'existe pas");
        }

      } else {
        throw new Error("La cle 'announceSymbol' est absente du message");
      }
      break;

    case "Misère":
      if (this.state === STATE_ANNOUNCE) this.players[this.currentPlayer].announce.name = "Petite misère";
      else this.players[this.currentPlayer].announce.name = "Grande misère";
      break;

    case "Chelem":
      this.players[this.currentPlayer].announce.name = "Petit chelem";
      break;

    default:
      this.players[this.currentPlayer].announce.name = message.announce;
      break;

  } // End switch
};

Whist.prototype.announceGetNextPlayerAndMaybeChangeState = function announceGetNextPlayerAndMaybeChangeState() {
  var self = this;

  if (Object.keys(this.players).filter(function(p){return self.players[p].announce.name === "Premier" || _.isUndefined(self.players[p].announce.name)}).length > 0) {
    // Il reste des joueurs qui n'ont pas annoncé, on leur donne la parole un à un
    do {
      this.currentPlayer = this.nextPlayer();
    } while (!_.isUndefined(this.players[this.currentPlayer].announce.name) && !this.players[this.currentPlayer].announce.name === "Premier");

  } else {
    this.state = STATE_BIDS;
    this.bidsGetNextPlayerAndMaybeChangeState();
  }
}

Whist.prototype.bidsGetNextPlayerAndMaybeChangeState = function bidsGetNextPlayerAndMaybeChangeState() {
  // On compte le nombre de personnes qui n'ont pas passé
  var self = this;
  var notPass = Object.keys(this.players).filter(function(p){return self.players[p].announce.name !== "Passer"});
  switch (4 - notPass.length) {
    case 4:
      // Tout le monde a passé, on arrête
      this.state = STATE_END;
    case 3:
      // Tout le monde a passé sauf un joueur, il gagne les enchère et la partie se lance
      this.currentPlayer = Object.keys(this.players)[0]; // Par défaut celui qui entre est le premier à avoir annoncé

      // On récupère celui qui a annoncé qqch
      var pl = Object.keys(this.players).filter(function(p){return self.players[p].announce.name !== "Passer"})[0];

      // En fonction du type de cette annonce, on donnera ou pas d'atoux et il pourra ou pas commencer
      switch (ANNOUNCES[this.players[pl].announce.name].type) {
        case "Solo":
          this.game.trump = this.players[pl].announce.symbol;
          break;
        case "Abondance":
          this.game.trump = this.players[pl].announce.symbol;
          this.currentPlayer = pl;
          break;
        case "Chelem":
          this.currentPlayer = pl;
          break;
      }
      this.state = STATE_PLAY;
      break;
    case 2:
      // Deux joueurs ont annoncé, on regarde si ils se sont emballés l'un l'autre ou si ils sont trou ensemble
      var playersType = notPass.map(function(p){return self.players[p].announce.type});
      if (_.every(playersType, function(t){return t === "Emballage"}) || _.every(playersType, function(t){return t === "Trou"})) {

        if (playersType[0] === "Emballage") this.game.trump = this.players[notPass[0]].announce.symbole;
        else if (this.players[notPass[0]].announce.name === "Bouche-trou") this.currentPlayer = notPass[0];
        else this.currentPlayer = notPass[1];

        this.state = STATE_PLAY;
        break;
      }
      // Sinon on break pas pour entrer dans le cas suivant
    default:
      // Dans tous les autres cas, on donne la parole à celui dont l'annonce est la plus faible
      var self = this;
      // Cette ligne de code fait 589 caractères et fonctionne très bien, tu y touches, je te tue.
      this.currentPlayer = Object.keys(this.players).filter(function(pl){
        // On ne garde que ceux qui n'ont pas passé et qui ne sont pas muet
        return self.players[pl].announce.name !== "Passer" && self.players[pl].announce.canTalk
      }).map(function(pl){
        // On ne garde que le nom de joueur (index 0), son annonce (index 1) et le symbole de l'annonce (ou le symbole le plus faible)
        return [pl, self.players[pl].announce.name, _.isUndefined(self.players[pl].announce.symbol) ? cardsLib.symbols[3] : self.players[pl].announce.symbol]
      }).sort(function(tpl1, tpl2){
        // On trie par ordre croissant d'annonce (primaire) et par ordre croissant de puissance de symbole (secondaire, la décimale)
        var tpl1AnnounceStrength = Object.keys(ANNOUNCES).reverse().indexOf(tpl1[1]);
        var tpl1SymbolStrength = cardsLib.symbols.slice().reverse().indexOf(tpl1[2]) / 4;
        var tpl2AnnounceStrength = Object.keys(ANNOUNCES).reverse().indexOf(tpl2[1]);
        var tpl2SymbolStrength = cardsLib.symbols.slice().reverse().indexOf(tpl2[2]) / 4;
        return tpl1AnnounceStrength + tpl1SymbolStrength - tpl2AnnounceStrength - tpl2SymbolStrength}
      )[0][0]; // Pour le premier tuple, son pseudo
  }
};

Whist.prototype.dealWithBids = function dealWithBids(message) {
  switch (message.bid) {
    case "Passer":
      // Si c'est un emballage qui passe, qu'il est au moins enchéri deux fois et qu'il était celui qui a emballé, alors il "Passe la main"
      if (ANNOUNCES[this.players[this.currentPlayer].announce.name].type == "Emballage" && !this.players[this.currentPlayer].announce.wasSolo && Object.keys(ANNOUNCES).indexOf(this.players[this.currentPlayer].announce.name) <= Object.keys(ANNOUNCES).indexOf("Emballage 10")) {
        this.players[this.currentPlayer].announce.canTalk = false;
        this.players[this.players[this.currentPlayer].announce.myFriend].canTalk = true;

      // Sinon on s'écrase
      } else {
        if (!_.isUndefined(this.players[this.currentPlayer].announce.myFriend)) this.players[this.players[this.currentPlayer].announce.myFriend].announce.name = "Passer"
        this.players[this.currentPlayer].announce.name = "Passer";
      }
      break;

    case "Emballer":
      if ("symbol" in message) {
        if (message.symbol in cardsLib.symbols) {
          // Vérifier qu'on a au moins une carte de cette couleur dans son jeu
          if (_.any(this.players[this.currentPlayer].cards.cards, function(c){return c.symbol === message.symbol})) {
            // Vérifier qu'on a déjà un solo dans le symbol désiré
            var self = this;
            var others = Object.keys(this.players).filter(function(pl){return self.players[pl].announce.name == "Solo 6" && self.players[pl].announce.symbol === message.symbol})
            if (others.length === 1) {
              // Vérifier que j'étais solo et que le symbole que j'avais annoncé est plus faible que le symbole que je veux emballer
              if (this.players[this.currentPlayer].announce.name == "Solo 6" && this.cards.indexOf(this.players[this.currentPlayer].announce.symbol) < this.cards.indexOf(message.symbol)) {

                  this.players[this.currentPlayer].announce.name = "Emballage 8";
                  this.players[this.currentPlayer].announce.symbol = message.announceSymbol;
                  this.players[this.currentPlayer].announce.wasSolo = false;
                  this.players[this.currentPlayer].announce.myFriend = others[0];

                  this.players[others[0]].announce.name = "Emballage 8";
                  this.players[others[0]].announce.canTalk = false;
                  this.players[others[0]].announce.wasSolo = true;
                  this.players[others[0]].announce.myFriend = this.currentPlayer;

              } else {
                throw new Error("On ne peut pas emballer plus faible que soit");
              }
            } else {
              throw new Error("L'emballage est impossible (pour 50k raisons possible)");
            }
          } else {
            throw new Error("Le joueur ne possède aucune carte de ce type");
          }

        } else {
          throw new Error("Le symbole n'est pas valide");
        }

      } else {
        throw new Error("La clef 'symbol' n'est pas dans le message");
      }
      break;

    case "Encherir":
      if (!(_.isUndefined(ANNOUNCES[this.players[this.currentPlayer].announce.name].next))) {
        this.players[this.currentPlayer].announce.name = ANNOUNCES[this.players[this.currentPlayer].announce.name].next;
        var theFriend = this.players[this.currentPlayer].announce.myFriend;
        if (!_.isUndefined(theFriend)) this.players[theFriend].announce.name = ANNOUNCES[this.players[theFriend].announce.name].next;
      }
      else throw new Error("Impossible d'enchérir plus haut");
      break;
  }
};

Whist.prototype.dealWithCardPlayed = function dealWithCardPlayed(card) {
  if (this.game.folds.length < this.game.turn) this.game.folds.append(new Cards([]));
  if (this.players[this.currentPlayer].cards.contains(card)) {

    // Le premier joue ce qu'il veut
    if (_.isEmpty(this.game.folds[this.game.turn])) {
      this.game.folds[this.game.turn].add(this.players[this.currentPlayer].cards.get(card));

    // Les autres doivent suivre si ils peuvent
    } else if (this.game.folds[this.game.turn].cards[0].symbol == card.symbol) {
      this.game.folds[this.game.turn].add(this.players[this.currentPlayer].cards.get(card));

    } else if (_.any(this.players[this.currentPlayer].cards.cards,function(c) {return this.players[this.currentPlayer].cards.cards[c].symbol == this.game.folds[this.game.turn].cards[0].symbol}) == false) {
        this.game.folds[this.game.turn].add(this.players[this.currentPlayer].cards.get(card));
    } else {
      throw new Error("Le joueur doit suivre");
    }
  } else {
    throw new Error("Le joueur doit posséder la carte");
  }
};

Whist.prototype.dealWithTurns = function dealWithTurns() {
  // Si on est à la fin du tour
  if (this.game.folds[this.game.turn].length === 4) {
    // On donne une valeur à chaque carte jouée
    var sym = this.game.folds[this.game.turn].cards[0].symbol;
    var values = [];
    for (var card of this.game.folds[this.game.turn].cards) {
      if (card.symbol == sym) {
        // Si le joueur a suivi, sa carte compte tel quelle
        values.push(card.value);
      } else if (card.symbol == this.game.trump) {
        // Si il coupe, sa carte a une valeur plus haute que si il avait suivi
        values.push(card.value + 13);
      } else {
        // Si il n'a ni suivi ni coupé, sa carte ne vaut rien
        values.push(0);
      }
    }

    // On récupère le joueur ayant gagné le pli
    var players = Object.keys(this.players)
    var winner = players[(players.indexOf(nextPlayer.call(this)) + values.indexOf(_.max(values))) % 4];
    this.players[winner].folds.append(this.game.folds[this.game.turn]);

    if (this.game.turn === 13) {
      // Si c'était le dernier tour, on compte les points
      this.state = STATE_END;
    } else {
      // Sinon celui qui a gagné le pli pourra rentrer et on commence un nouveau tour
      this.currentPlayer = winner;
      this.game.turn++;
    }

  // Si ce n'est pas la fin du tour
  } else {
    this.currentPlayer = this.nextPlayer();
  }
};

Whist.prototype.calculateTheScore = function calculateTheScore() {
  for (var pl in this.players) {
    if (this.players[pl].announce.name !== "Passer") {
      var folds = _.isUndefined(this.players[pl].announce.myFriend) ? this.players[pl].folds.length : this.players[pl].folds.length + this.players[this.players[pl].myFriend].folds.length;
      switch (ANNOUNCES[this.players[pl].announce.name].type) {
        case "Solo":
          // Dans le cas d'un solo, le joueur doit au moins faire le nombre de pli annoncé mais jamais plus de 8 (il aurait du annoncer abondance)
          if (folds >= ANNOUNCES[this.players[pl].announce.name].folds && folds < 9) {
            // Si le joueur réussi, il gagne ses points
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].success;
          } else {
            // Sinon il en perd et ce sont les autres qui en gagnent
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].looseMe;
            for (var opl of _.without(Object.keys(this.players), pl)) {
              this.players[opl].score += ANNOUNCES[this.players[pl].announce.name].winOthers;
            }
          }
          break;

        case "Piccolo":
        case "Misère":
          // Dans le cas d'une misère ou d'un picollo, le joueur doit faire exactement le nombre de pli demandé
          if (folds == ANNOUNCES[this.players[pl].announce.name].folds) {
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].success;
          } else {
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].looseMe;
            for (var opl of _.without(Object.keys(this.players), pl)) {
              this.players[opl].score += ANNOUNCES[this.players[pl].announce.name].winOthers;
            }
          }
          break;
        case "Emballage":
          // Dans le cas d'un emballage, les joueurs doivent avoir fait au moins le nombre de pli annoncé. Chacun gagne ses points
          if (folds >= ANNOUNCES[this.players[pl].announce.name].folds) {
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].success;
            this.players[this.players[pl].announce.myFriend].score += ANNOUNCES[this.players[pl].announce.name].success;
          } else {
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].looseMe;
            this.players[this.players[pl].announce.myFriend].score += ANNOUNCES[this.players[pl].announce.name].looseMe;
            for (var opl of _.difference(Object.keys(this.players), [pl, this.players[pl].announce.myFriend])) {
              this.players[opl].score += ANNOUNCES[this.players[pl].announce.name].winOthers;
            }
          }
          break;

        default:
          // Pour abondance et chelem, le joueur doit au moins faire le nombre de pli annoncé
          if (folds >= ANNOUNCES[this.players[pl].announce.name].folds) {
            // Si le joueur réussi, il gagne ses points
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].success;
          } else {
            // Sinon il en perd et ce sont les autres qui en gagnent
            this.players[pl].score += ANNOUNCES[this.players[pl].announce.name].looseMe;
            for (var opl of _.without(Object.keys(this.players), pl)) {
              this.players[opl].score += ANNOUNCES[this.players[pl].announce.name].winOthers;
            }
          }
      }
      break;
    }
  }
};

Whist.prototype.getAvailableAnnounces = function getAvailableAnnounces() {
  a = [];
  switch (this.state) {
    case STATE_ANNOUNCE:
      a = _.without(_.uniq(Object.keys(ANNOUNCES).map(function(ann){return ANNOUNCES[ann].type})), "Trou");
      if (this.currentPlayer === Object.keys(this.players)[0] && _.isUndefined(this.players[this.currentPlayer].announce.name)) {
        a.push("Premier");
      }
      break;

    case STATE_ANNOUNCE_AFTER_HOLE:
      a = _.uniq(Object.keys(ANNOUNCES).filter(function(ann){return ANNOUNCES[ann].type !== "Solo" && ANNOUNCES[ann].type !== "Emballage" && ANNOUNCES[ann].type !== "Piccolo" && ann != "Petite misère"}));
      break;

    case STATE_BIDS:
      a = ["Emballer", "Encherir", "Passer"];
      break;

  }
  return a;
}

Whist.prototype.checkForHole = function checkForHole() {
  for (var pl in this.players) {
    if (this.players[pl].cards.cards.filter(function(c){return c.name === "As"}).length === 3) return pl;
  }
  return undefined;
}

Whist.prototype.isDick = function isDick(pl) {
  var self = this;
  return _.any(self.players[pl].cards.cards, function(card) {return card.name === "As"})
}

module.exports.Whist = Whist;
