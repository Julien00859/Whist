// Importation des dépendances
const fs = require("fs");
const pathlib = require("path");
const net = require("net");
const express = require("express");
const app = express(http);
const http = require("http").Server(app);
const socketio = require("socket.io")(http);
const _ = require("underscore");
const bunyan = require("bunyan");
const ent = require("ent");
const uuid = require("uuid");
const Whist = require("./whist.js").Whist;
const WhistError = require("./whist.js").WhistError;

// Récupération de la configuration
const config = JSON.parse(fs.readFileSync(pathlib.join(process.cwd(), "config.json"), "utf8"));

// Log les messages de type info et warn dans la console, log les messages de type error et fatal dans le fichier fourni par la configuration
var log = bunyan.createLogger({
  name: "whist",
  streams: [
    {
      level: "info",
      stream: process.stdout
    },
    {
      level: "error",
      stream: process.stderr
    }
  ]
});

// Définition de la racine
app.use(express.static("../client/"));

// Lancement du serveur web
http.listen(config.nodePort, function(){
    log.info("Server running on localhost:" + config.nodePort);
});

socketio.on("connection", function(socket){
  log.info("User connected with ID: " + socket.client.id);

  socket.on("register", function(nickname){
    if (typeof nickname == "string" && nickname.trim().length >= 3 && !(nickname.trim() in room.nicknames)) {
      nickname = ent.encode(nickname.trim());
      socket.emit("nickname validation", nickname);

      room.sockets[socket.client.id] = nickname;
      room.nicknames[nickname] = {"socket": socket, "gameId": undefined};
      room.waitingPlayers.push(nickname);
      log.info("User " + socket.client.id + " registered with nickname: " + nickname + " [" + room.waitingPlayers.length + "/4]")

      if (Math.floor(room.waitingPlayers.length) / 4 === 1) {
        var players = room.waitingPlayers.splice(0, 4)
        var game = new Whist(players);
        var gameId = uuid.v1();
        room.tables[gameId] = game;

        for (var pl of players) {
          room.nicknames[pl].gameId = gameId;
          room.nicknames[pl].socket.emit("game joined", {
            "cards": game.players[pl].cards.toString(),
            "players": players
          });
          room.nicknames[pl].socket.emit("next turn", {
            "state": game.state,
            "availableAnnounces": game.getAvailableAnnounces(),
            "currentPlayer": game.currentPlayer
          });
          if (game.state == 2) {
            var announces = Object.keys(game.players).map(function(pl){
              return {
                "player": pl,
                "announce": game.players[pl].announce.name,
                "symbol": game.players[pl].announce.symbol
              }
            });
            room.nicknames[pl].socket.emit("announces", announces);
          }
        }
        log.info("New table filled ! Game ID: " + gameId + ", Players: " + players.join(", "));

      } else {
        socket.emit("waiting room joined", room.waitingPlayers);
        _.chain(room.waitingPlayers).without(nickname).each(function(nick) {room.nicknames[nick].socket.emit("waiting room joined by", nickname)});
      }

    } else if (nickname.trim() in room.nicknames) {
      socket.emit("myerror", "Nickname already used, please select an other one");

    } else if (typeof nickname != "string") {
      socket.emit("myerror", "The nickname must be a string");

    } else {
      socket.emit("myerror", "The nickname must be at least 3 characters long")
    }

  });

  socket.on("play", function(arg1, arg2){
    var nick = room.sockets[socket.client.id];
    var gameId = room.nicknames[nick].gameId;
    var game = room.tables[gameId];
    var previousState = game.state;

    log.info("[ " + gameId + "]", nick, arg1, arg2);

    try {
      game.playTurn(nick, arg1, arg2);
    } catch (err) {
      if (err instanceof WhistError) {
        log.warn("[" + gameId + "] " + err.message);
        socket.emit("myerror", err.message);
      } else {
        log.error(err);
      }
      return;
    }

    if (previousState < 4) {
      var announces = game.playersList.map(function(pl){
        return {
          "player": pl,
          "announce": game.players[pl].announce.name,
          "symbol": game.players[pl].announce.symbol
        }
      });
      _.each(game.playersList, function(pl){
        room.nicknames[pl].socket.emit("announces", announces);
      });
    }

    if (previousState != game.state && game.state == 5 && !_.isUndefined(game.game.trump)) {
      _.each(game.playersList, function(pl) {
        room.nicknames[pl].socket.emit("trump", game.game.trump);
      });
    }
    log.info("[" + game.id + "] Current player: " + game.currentPlayer);
  });

  socket.on('disconnect', function(){
    kick(socket.client.id);
  });

  socket.on("close", function(){
    kick(socket.client.id);
  });

});

function kick(socketId) {
  if (socketId in room.sockets) {
    log.info("Kick " + room.sockets[socketId] + " (" + socketId + ")");
    if (room.nicknames[room.sockets[socketId]].socket.connected) room.nicknames[room.sockets[socketId]].socket.close()
    delete room.nicknames[room.sockets[socketId]];
    if (_.contains(room.waitingPlayers, room.sockets[socketId])) room.waitingPlayers.splice(room.waitingPlayers.indexOf(room.sockets[socketId]), 1);
    delete room.sockets[socketId];
  }
}

var room = {
  sockets: {
    // "socket": "nickname"
  },
  nicknames: {
    // "nickname": {
    //   gameId: undefined,
    //   socket: undefined
    // }
  },
  tables: {
    // "gameId": Whist()
  },
  waitingPlayers: [
    // "nickname"
  ]
}
