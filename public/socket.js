var socket = io();
/**
 * Sockets
 */
socket.on('connect', function () {
    socket.emit('requestOldPlayers');
});
socket.on('loadModels', function(data) {
    loadModels(data);
});
socket.on('createWorld', function(data) {
    createWorld(data);
});
socket.on('createPlayer', function (data) {
    createPlayer(data);
});
socket.on('addOtherPlayer', function (data) {
    addOtherPlayer(data);
});
socket.on('updatePosition', function (data) {
    updatePlayerPosition(data);
});
socket.on('inputAction', function(data) {
    checkKeyStates(data);
});
socket.on('playerAttack', function (data) {
    playerAttack(data);
});
socket.on('removeOtherPlayer', function (data) {
    removeOtherPlayer(data);
});