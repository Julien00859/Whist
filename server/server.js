// Importation des dépendances
const fs = require("fs");
const pathlib = require("path");
const net = require("net");
const express = require("express")
const app = express(http)
const http = require("http").Server(app);
const socketio = require("socket.io")(http);
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
  console.log("User connected");

  socket.on("register", function(nickname){
    if (!(nickname in room.nicknames)) {
      room.sockets[socket] = nickname;
      room.nicknames[nickname] = {"socket": socket, "gameId": undefined};
      room.waitingPlayers.push(nickname);
      if (Math.floor(room.waitingPlayers.length) / 4 === 1) {
        var players = room.waitingPlayers.splice(0, 4)
        var game = new Whist(players);
        for (var pl of players) {
          room.nicknames[pl].gameId = game.id;
          room.nicknames[pl].socket.emit("game joined", {"cards": game.players[pl].cards.toString(), "players": players, "state": game.state, "currentPlayer": game.currentPlayer});
        }
        console.log("New table filled ! Game ID: " + game.id + " Players: " + players.join(", "));
      }


    } else {
      socket.emit("myerror", {code: 1, msg: "Nickname already used, please select an other one"});
    }
  });

});

var room = {
  sockets: {},
  nicknames: {},
  tables: {},
  waitingPlayers: []
}
