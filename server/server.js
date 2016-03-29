// Importation des dépendances
const fs = require("fs");
const pathlib = require("path");
const net = require("net");
const express = require("express")
const app = express(http)
const http = require("http").Server(app);
const socketio = require("socket.io")(http);
const _ = require("underscore");
const Whist = require("./whist.js").Whist;

// Récupération de la configuration
const config = JSON.parse(fs.readFileSync(pathlib.join(process.cwd(), "config.json"), "utf8"));

// Définition de la racine
app.use(express.static("../client/"));

// Lancement du serveur web
http.listen(config.nodePort, function(){
    console.log("Server running on localhost:" + config.nodePort + "\n");
});

socketio.on("connection", function(socket){
  console.log("User connected with ID: " + socket.client.id);

  socket.on("register", function(nickname){
    if (typeof nickname == "string" && nickname.trim().length >= 3 && !(nickname.trim() in room.nicknames)) {
      nickname = nickname.trim();
      socket.emit("nickname validation", nickname);
      _.each(room.waitingPlayers, function(nick) {room.nicknames[nick].socket.emit("waiting room joined by", nickname)})

      room.sockets[socket.client.id] = nickname;
      room.nicknames[nickname] = {"socket": socket, "gameId": undefined};
      room.waitingPlayers.push(nickname);
      console.log("User " + socket.client.id + " registered with nickname: " + nickname + " [" + room.waitingPlayers.length + "/4]")


      if (Math.floor(room.waitingPlayers.length) / 4 === 1) {
        var players = room.waitingPlayers.splice(0, 4)
        var game = new Whist(players);
        room.tables[game.id] = game;

        for (var pl of players) {
          room.nicknames[pl].gameId = game.id;
          room.nicknames[pl].socket.emit("game joined", {
            "cards": game.players[pl].cards.toString(),
            "players": players
          });
          room.nicknames[pl].socket.emit("next turn", {
            "state": game.state,
            "availableAnnounces": game.getAvailableAnnounces(),
            "currentPlayer": game.currentPlayer
          });
        }
        console.log("New table filled ! Game ID: " + game.id + ", Players: " + players.join(", "));

      } else {
        socket.emit("waiting room joined", room.waitingPlayers);
      }

    } else if (nickname.trim() in room.nicknames) {
      socket.emit("myerror", {code: 1, msg: "Nickname already used, please select an other one"});

    } else if (typeof nickname != "string") {
      socket.emit("myerror", {code: 2, msg: "The nickname must be a string"});

    } else {
      socket.emit("myerror", {code: 3, msg: "The nickname must be at least 3 characters long"})
    }

  });

  socket.on("chat message", function(message){
    if (_.contains(room.waitingPlayers, room.sockets[socket.client.id]) && typeof message == "string" && message.trim().length > 0 && message.trim().length < 280) {
      _.each(room.waitingPlayers, function(nick) {room.nicknames[nick].socket.emit("chat message", {sender: room.sockets[socket.client.id], time: new Date(), msg: message.trim()})})
    } else if (!_.contains(room.waitingPlayers, room.sockets[socket.client.id])) {
      socket.emit("myerror", {code: 6, msg: "Whist !"});
    } else if (typeof message != "string") {
      socket.emit("myerror", {code: 3, msg: "The message must be a string"});
    } else if (message.trim().length == 0) {
      socket.emit("myerror", {code: 4, msg: "The message cannot be empty"});
    } else {
      socket.emit("myerror", {code: 5, msg: "The message is too long"});
    }
  });

  socket.on("game announce", function(argAnnounce, argSymbol){
    var nick = room.sockets[socket.client.id];
    var gameId = room.nicknames[nick].gameId;
    var game = room.tables[gameId];

    console.log(nick, argAnnounce, argSymbol)
    try {
      game.playTurn(nick, {announce: argAnnounce, announceSymbol: argSymbol});
    } catch (err) {
      console.log("[" + gameId + "] " + err)
      socket.emit("myerror", {code: 6, msg: err.message});
      return;
    }
    console.log("[" + game.id + "] " + nick + " announced " + argAnnounce + (argSymbol ? " " + argSymbol : ""));
    _.each(Object.keys(game.players), function(pl){
      console.log("[" + game.id + "] Emitting to " + pl);
      room.nicknames[pl].socket.emit("game announce", argAnnounce, argSymbol);
      room.nicknames[pl].socket.emit("next turn", {state: game.state, availableAnnounces: game.getAvailableAnnounces(), currentPlayer: game.currentPlayer});
    });
    console.log("[" + game.id + "] Current player: " + game.currentPlayer);
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
    console.log("Kick " + room.sockets[socketId] + " (" + socketId + ")");
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
