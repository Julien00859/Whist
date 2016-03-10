const _ = require("underscore");
const Carts = require("./carts.js").Carts;

const STATE_ANNOUNCE = 0;
const STATE_ANNOUNCE_AFTER_HOLE = 1;
const STATE_BIDS = 2;
const STATE_PLAY = 3;
const STATE_END = 4;

const ANNOUNCES = {
  "Grand chelem": {
    success: 200, // Si je réussi mon annonce, le nombre de points que je gagne
    looseMe: -200, // Si je rate mon annonce, le nombre de points que je perd
    winOthers: 66, // Si je rate mon annonce, le nombre de points que les autres gagnent
    type: "Chelem", // Le type de l'annonce (Abondance, Misère, Trou, Solo, Emballage, Passer)
    next: undefined // Si on peut surenchérir dessus, alors vers quoi est-ce qu'on surenchéri
  },
  "Petit chelem": {
    success: 100, looseMe: -100, winOthers: 33,
    type: "Chelem",
    next: "Grand chelem"
  },
  "Grande misère étalée": {
    success: 75, looseMe: -75, winOthers: 32,
    type: "Misère"
  },
  "Abondance 11": {
    success: 60, looseMe: -60, winOthers: 27,
    type: "Abondance",
    next: "Petit chelem"
  },
  "Abondance 10": {
    success: 42, looseMe: -42, winOthers: 25,
    type: "Abondance",
    next: "Abondance 11"
  },
  "Grande misère": {
    success: 36, looseMe: -36, winOthers: 66,
    type: "Misère",
    next: "Grande misère étalée"
  },
  "Bouche-trou": {
    success: 16, looseMe: 0, winOthers: 16,
    type: "Trou"
  },
  "Trou": {
    success: 16, looseMe: 0, winOthers: 16,
    type: "Trou"
  },
  "Abondance 9": {
    success: 32, looseMe: -32, winOthers: 21,
    type: "Abondance",
    next: "Abondance 10"
  },
  "Emballage 13": {
    success: 30, looseMe: -30, winOthers: 30,
    type: "Emballage"
    next: undefined
  },
  "Piccolo": {
    success: 24, looseMe: -24, winOthers: 16,
    type: "Misère",
    next: "Grande misère"
  },
  "Solo 8": {
    success: 21, looseMe: -24, winOthers: 16,
    type: "Solo",
    next: undefined
  },
  "Emballage 12": {
    success: 19, looseMe: -22, winOthers: 22,
    type: "Emballage",
    next: "Emballage 13"
  },
  "Petite misère": {
    success: 18, looseMe: -18, winOthers: 12,
    type: "Misère",
    next: "Piccolo"
  },
  "Emballage 11": {
    success: 16, looseMe: -19, winOthers: 19,
    type: "Emballage",
    next: "Emballage 12"
  },
  "Solo 7": {
    success: 15, looseMe: -18, winOthers: 12,
    type: "Solo",
    next: "Solo 8"
  },
  "Emballage 10": {
    success: 13, looseMe: -16, winOthers: 16,
    type: "Emballage",
    next: "Emballage 11"
  },
  "Solo 6": {
    success: 12, looseMe: -15, winOthers: 10,
    type: "Solo",
    next: "Solo 7"
  },
  "Emballage 9": {
    success: 10, looseMe: -13, winOthers: 13,
    type: "Emballage"
    next: "Emballage 10"
  },
  "Emballage 8": {
    success: 7, looseMe: -10, winOthers: 10,
    type: "Emballage",
    next: "Emballage 9"
  },
  "Passer": {
    type: "Passer"
  }
}

function dealWithAnnounce(message) {
  switch (message.announce) {
    case "Solo":
    case "Emballage":
    case "Abondance":
      // Il y a atoux, donc il doit y avoir la couleur en plus du type d'annonce
      if ("announceSymbol" in message) {
        if (message.announceSymbol in this.carts.symbols) {
          if (_.any(this.players[this.currentPlayer].carts.carts, function(c){return c.symbol === message.announceSymbol})) {
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
                  throw "Le symbole avait déjà été annoncé";
                }
                break;

              case "Emballage"
                var self = this;
                // On vérifie qu'un et un seul joueur avait déjà annoncé cette couleur avant
                var others = Object.keys(this.players).filter(function(pl){return self.players[pl].announce.symbol === message.announceSymbol}
                if (others.length === 1) {
                  this.players[this.currentPlayer].announce.name = "Emballage 8";
                  this.players[this.currentPlayer].announce.symbol = message.announceSymbol;
                  this.players[this.currentPlayer].announce.wasSolo = false;
                  this.players[this.currentPlayer].announce.myFriend = others[0];

                  this.players[others[0]].announce.name = "Emballage 8";
                  this.players[others[0]].announce.canTalk = false;
                  this.players[others[0]].announce.wasSolo = true;
                  this.players[this.currentPlayer].announce.myFriend = this.currentPlayer;

                } else {
                  throw "Le symbole n'avait pas encore été annoncé";
                }

              case "Abondance":
                this.players[this.currentPlayer].announce.name = "Abondance 9";
                this.players[this.currentPlayer].announce.symbol = message.announceSymbol;
                break;

              case "Trou":
                // Pour garder l'annonce, que ce soit trou ou bouche-trou
                if (this.players[this.currentPlayer].announce.name !== "Trou" && this.players[this.currentPlayer].announce.name !== "Bouche-trou") {
                  throw "On ne peut pas annoncer Trou, on l'est ou on ne l'est pas";
                }
                break;
            }
          else {
            throw "Le joueur doit posséder au moins une carte du symbole annoncé";
          }

        } else {
          throw "Le symbole n'existe pas";
        }

      } else {
        throw "La cle 'announceSymbol' est absente du message";
      }
      break;

    case "Misère":
      if (this.state === STATE_ANNOUNCE) this.players[this.currentPlayer].announce.name = "Petite misère";
      else this.players[this.currentPlayer].announce.name = "Grande misère";
      break;

    case "Chelem":
      this.players[this.currentPlayer].announce.name = "Petit chelem";
      break;

    case "Passer":
    case "Premier":
      this.players[this.currentPlayer].announce.name = message.announce;
      break;

  } // End switch
}

function announceGetNextPlayerAndMaybeChangeState() {
  var self = this;
  if (Object.keys(this.players).filter(function(p){return self.players[p].announce.name === "Premier" || _.isUndefined(self.players[p].announce.name)}).length > 0) {
    // Il reste des joueurs qui n'ont pas annoncé, on leur donne la parole un à un
    do {
      this.currentPlayer = nextPlayer.call(this);
    } while (!_.isUndefined(this.players[this.currentPlayer].announce.name) || this.players[this.currentPlayer].announce.name === "Premier");

  } else {
    // Tout le monde a annoncé ou passé
    // On compte le nombre de personnes qui ont passé
    switch (Object.keys(this.players).filter(function(p){return self.players[p].announce.name === "Passer").length) {
      case 4:
        // Tout le monde a passé, on arrête
        this.state = STATE_END;
      case 3:
        // Tout le monde a passé sauf un joueur, il gagne les enchère et la partie se lance
        this.currentPlayer = Object.keys(this.players)[0]; // Par défaut celui qui entre est le premier à avoir annoncé

        // On récupère celui qui a annoncé qqch
        var pl = Object.keys(this.players).filter(function(p){return self.players[p].announce.name !== "Passer")[0];

        // En fonction du type de cette annonce, on donnera ou pas d'atoux et il pourra ou pas commencer
        switch (ANNOUNCES[this.players[pl].announce.name].type) {
          case "Solo":
            this.atoux = this.players[pl].announce.symbole;
            this.currentPlayer = Object.keys(this.players)[0];
            break;
          case "Abondance":
            this.atoux = this.players[pl].announce.symbole;
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
        var players = Object.keys(this.players).filter(function(p){return self.players[p].announce.name !== "Passer")
        var playersType = players.map(function(p){return self.players[p].announce.type});
        if (_.every(playersType, function(t){return t === "Emballage"}) || _.every(playersType, function(t){return t === "Trou"})) {
          if (playersType[0] === "Emballage") this.atoux = this.players[players[0]].announce.symbole;
          else if (this.players[players[0]].announce.name === "Bouche-trou") this.currentPlayer = players[0];
          else if (this.players[players[1]].announce.name === "Bouche-trou") this.currentPlayer = players[1];
          else throw "Internal Error";
          this.state = STATE_PLAY;
          break;
        }
        // Sinon on break pas pour entrer dans le cas suivant
      default:
        // Dans tous les autres cas, on lance les enchères
        this.currentPlayer = Object.keys(this.players)[0]
        this.state = STATE_BIDS;
    }
  }
}

function dealWithBids(message) {
  switch (message.bid) {
    case "Passer":
      // Si c'est un emballage qui passe, qu'il est au moins enchéri deux fois et qu'il était celui qui a emballé, alors il "Passe la main"
      if (ANNOUNCES[this.players[this.currentPlayer].announce.name].type == "Emballage" && !this.players[this.currentPlayer].announce.wasSolo && Object.keys(ANNOUNCES).reverse().indexOf(this.players[this.currentPlayer].announce.name) > Object.keys(ANNOUNCES).reverse().indexOf("Emballage 10")) {
        this.players[this.currentPlayer].announce.canTalk = false;
        this.players[this.players[this.currentPlayer].announce.myFriend].canTalk = true;

      } else {
        if (!(_.isUndefined(this.players[this.currentPlayer].announce.myFriend))) this.players[this.players[this.currentPlayer].announce.myFriend].announce.name = "Passer"
        this.players[this.currentPlayer].announce.name = "Passer";
      }
      break;

    case "Emballer":
      if ("symbol" in message) {
        if (message.symbol in this.carts.symbols) {
          // Vérifier qu'on a au moins une carte de cette couleur dans son jeu
          if (_.any(this.players[this.currentPlayer].carts.carts, function(c){return c.symbol === message.symbol})) {
            // Vérifier qu'on a déjà un solo dans le symbol désiré
            var self = this;
            var others = Object.keys(this.players).filter(function(pl){return self.players[pl].announce.name == "Solo 6" && self.players[pl].announce.symbol === message.symbol})
            if (others.length === 1) {
              // Vérifier que j'étais solo et que le symbole que j'avais annoncé est plus faible que le symbole que je veux emballer
              if (this.players[this.currentPlayer].announce.name == "Solo 6" && this.carts.indexOf(this.players[this.currentPlayer].announce.symbol) < this.carts.indexOf(message.symbol)) {

                  this.players[this.currentPlayer].announce.name = "Emballage 8";
                  this.players[this.currentPlayer].announce.symbol = message.announceSymbol;
                  this.players[this.currentPlayer].announce.wasSolo = false;
                  this.players[this.currentPlayer].announce.myFriend = others[0];

                  this.players[others[0]].announce.name = "Emballage 8";
                  this.players[others[0]].announce.canTalk = false;
                  this.players[others[0]].announce.wasSolo = true;
                  this.players[this.currentPlayer].announce.myFriend = this.currentPlayer;

              } else {
                throw "On ne peut pas emballer plus faible que soit"

            } else {
              throw "L'emballage est impossible (pour 50k raisons possible)"
            }
          } else {
            throw "Le joueur ne possède aucune carte de ce type"
          }

        } else {
          throw "Le symbole n'est pas valide"
        }

      } else {
        throw "La clef 'symbol' n'est pas dans le message"
      }
      break;

    case "Encherir":
      if (!(_.isUndefined(ANNOUNCES[this.players[this.currentPlayer].announce.name].next))) this.players[this.currentPlayer].announce.name = ANNOUNCES[this.players[this.currentPlayer].announce.name].next
      else throw "Impossible d'enchérir plus haut";
      break;

  }
}

function announceGetNextPlayerAndMaybeChangeState() {

}

function nextPlayer(player) {
  if (_.isUndefined(player)) var player = this.currentPlayer;
  var players = Object.keys(this.players);
  var index = players.indexOf(player);
  return players[index < 3 ? index + 1 : 0];
}

// Classe représentant une partie de Whist selon les rêgles de Julien et Nico
var Whist = function Whist(players) {
  this.id = _.uniqueId();
  // Crée un jeu et le distribue à chaque joueur, crée la mapping des joueurs, vérifie si il y a eu trou
  this.newNormalGame = function newNormalGame(player) {
    // Génération d'un jeu de carte qu'on mélange
    var carts = new Carts();
    carts.shuffle();

    // Création de la mapping des joueurs
    if (players.length === 4 ) {
      this.players = {};
      for (var i in players) {
        this.players[players[i]] = {
          carts: new Carts(carts.pull(13)), // Distribution de 13 cartes par joueur
          announce: {
            name: undefined, // Le nom de l'annonce
            symbol: undefined, // Si on annonce Solo ou Emballage, le symbole de l'annonce
            canTalk: true // Celui qui peut parler durant un emballage
            wasSolo: undefined //  Passe à true si un joueur se fait emballé, passe à false si on emballe quelqu'un
            myFriend: undefined // Le nom de notre allié pour les emballages
          }
        }
        // On trie le jeu de chaque joueur
        this.players[players[i]].carts.sort()

        // Vérification pour voir si il a 3 as (Trou)
        if (this.players[players[i]].carts.filter(function(c){return c.name === "As"}).length === 3) {
          this.players[players[i]].announce.name = "Trou"; // On force son annonce à être trou
          this.state = STATE_ANNOUNCE_AFTER_HOLE; // Le premier ne pourra pas annoncer Premier
        }
      }
    } else {
      throw "InvalidArguments We need 4 players name"
    }

    if (this.state === STATE_ANNOUNCE_AFTER_HOLE) {
      // Il y a eu trou
      for (var i in players) {
        // On va chercher celui qui a le dernier As
        if (this.players[players[i]].carts.filter(function(c){return c.name === "As"}).length === 1) {
          this.players[players[i]].announce.name = "Bouche-trou"; // On force son annonce à être Bouche-trou
        }
        // On trouve le premier qui n'a pas parlé pour lui donner la parole
        var pl = players[0];
        while (!_isUndefined(this.players[pl].announce.name)) pl = nextPlayer.call(this, pl);
        this.currentPlayer = pl;
      }
    } else {
      // Il n'y a pas eu trou
      this.state = STATE_ANNOUNCE;
      this.currentPlayer = Object.keys(this.players)[0];
    }
  }


  this.playTurn = function playTurn(player, message) {
    if (player === this.currentPlayer) {

      switch (this.STATE) {
        case STATE_ANNOUNCE:
          // On récupère la liste des type d'annonce sans le Trou
          var availableAnnounces = _.uniq(Object.keys(ANNOUNCES).map(function(ann){return ann.type}).filter(function(type){return type !== "Trou"});
          if (player === Object.keys(players)[0]) availableAnnounces.push("Premier") // Le premier pourra annoncer Premier

        case STATE_ANNOUNCE_AFTER_HOLE:
          // Récupère la liste d'annonce sans le Solo et l'Emballage (qui sont trop faibles pour battre le trou)
          if (_.isUndefined(availableAnnounces)) var availableAnnounces = _.uniq(Object.keys(ANNOUNCES).filter(function(ann){return ann.type !== "Solo" && ann.type !== "Emballage"});

          if ("announce" in message) {
            if (_.contains(availableAnnounces, message.announce)) {
              dealWithAnnounce.call(this, message);
              announceGetNextPlayerAndMaybeChangeState.call(this);

            } else {
              throw "L'annonce n'existe pas"
            }

          } else {
            throw "La clef 'announce' est absente du message"
          }
          break; // End STATE_ANNOUNCE

        case STATE_BIDS:
          // On peut emballer plus fort, enchérir, passer
          if ("bid" in message) {
            if (_.contains(["Emballer", "Encherir", "Passer"], message.bid)) {
              dealWithBids.call(this, message);
              bidsGetNextPlayerAndMaybeChangeState.call(this);
            } else {
              throw "L'enchère n'existe pas"
            }

          } else {
            throw "La clef 'bid' est absente du message"
          }
          break;

        case STATE_PLAY:
          break;

        case STATE_END:
          break;

      }


    } else {
      throw "Ce n'est pas au tour du joueur donné"
    }
  }
}

module.exports.Whist = Whist;
