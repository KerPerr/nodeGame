/**
 * HANDLE PLAYERS HERE
 */
var players = [];

class Player {
    constructor() {
        this.playerId = players.length;
        this.username = null;
        this.location = null;
        
        // POSITION
        this.position = {
            x: 1,
            y: 0.5,
            z: 1
        }

        // ROTATION
        this.rotation = {
            x: 0,
            y: 0,
            z: 0
        }

        // SIZE
        this.size = {
            x: 1,
            y: 1,
            z: 1
        }

        // STATS
        this.stats = {
            speed: 3,
            health: 10,
            maxHealth: 10,
            mana: 10,
            maxMana: 10,
            atkSpeed: 200
        }

        this.inputs = []
    }

    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    setRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
    }
}

var addPlayer = function (id) {
    var player = new Player();
    player.playerId = id;
    players.push(player);
    return player;
};

var removePlayer = function (player) {
    var index = players.indexOf(player);
    if (index > -1) {
        players.splice(index, 1);
    }
};

var updatePlayerData = function (data) {
    var player = playerForId(data.playerId);
    if(player) {
        player.position = data.position;
        player.rotation = data.rotation;
    }
    return player;
};  

var playerForId = function (id) {
    var player;
    for (var i = 0; i < players.length; i++) {
        if (players[i].playerId === id) {
            player = players[i];
            break;
        }
    }
    return player;
};

module.exports.players = players;
module.exports.addPlayer = addPlayer;
module.exports.removePlayer = removePlayer;
module.exports.updatePlayerData = updatePlayerData;
module.exports.playerForId = playerForId;
