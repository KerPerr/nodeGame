var socket = io();
/**
 * Sockets
 */
socket.on('connect', function () {
    console.log('REQUEST OTHER');
    socket.emit('requestOldPlayers');
});
socket.on('loadModels', function(data) {
    console.log('LOAD MODEL');
    loadModels(data);
});
socket.on('createWorld', function(data) {
    console.log('CREATE WORLD');
    createWorld(data);
});
socket.on('createPlayer', function (data) {
    console.log('CREATE PLAYER');
    createPlayer(data);
});
socket.on('addOtherPlayer', function (data) {
    console.log('ADD OTHER');
    addOtherPlayer(data);
});
socket.on('updatePosition', function (data) {
    console.log('UPDATE POSITION');
    updatePlayerPosition(data);
});
socket.on('inputAction', function(data) {
    console.log('INPUT');
    checkKeyStates(data);
});
socket.on('playerAttack', function (data) {
    console.log('PLAYER ATTACK');
    playerAttack(data);
});
socket.on('removeOtherPlayer', function (data) {
    console.log('REMOVE OTHER');
    removeOtherPlayer(data);
});