// Importation des dépendances
const fs = require("fs");
const pathlib = require("path");
const net = require("net");
const express = require("express")
const app = express(http)
const http = require("http").Server(app);
const socketio = require("socket.io")(http);

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

});
