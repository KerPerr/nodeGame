/**
 * DEPENDANCIES
 */
var fs = require('fs');
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);
var world = require('./world');

const port = process.env.PORT || 3000
//app.set('port', 8001);
app.use('/public', express.static(__dirname + '/public'));

/**
 * ROUTING
 */
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * WEBSOCKET HANDLER
 */
io.on('connection', function(socket) {

	console.log("Welcome " + socket.id);

	socket.emit(
		'loadModels',
		fs.readdirSync('./public/models/NaturePack/')
			.filter(p => p.endsWith('.obj'))
	);

	var id = socket.id;
	world.addPlayer(id);
	var player = world.playerForId(id);

	// sending to the client
	socket.emit('createPlayer', player);

	// sending to all clients except sender
	socket.broadcast.emit('addOtherPlayer', player);

	socket.on('requestOldPlayers', function() {
        for (var i = 0; i < world.players.length; i++) {
            if (world.players[i].playerId != id) {
				socket.emit('addOtherPlayer', world.players[i]);
			}
        }
	});
	
	socket.on('loadComplete', function() {
		socket.emit(
			'createWorld',
			JSON.parse(fs.readFileSync('./data/map.base.json'))
		);
	});

	socket.on('input', function(data, press) {
		player.inputs[data] = press;
		socket.emit('inputAction', player);
	});

	socket.on('updatePosition', function(data) {
        var newData = world.updatePlayerData(data);
        socket.broadcast.emit('updatePosition', newData);
	});
	/*
	let interval = setInterval(() => {
		io.emit('inputAction', player)
	}, 25)
	*/
	socket.on('disconnect', function () {
		console.log('Goodbye ' + socket.id);
		// sending to all clients in 'game' room, including sender
		io.emit('removeOtherPlayer', player);
		world.removePlayer(player);
		//clearInterval(interval);
	});
});

/**
 * STARTING SERVER
 */
server.listen(port, function() {
	console.log('Starting server on port ' + port);
});