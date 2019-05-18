var stats, scene, clock, timeElapsed, camera;
var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

var models = [], objects = [];
var player, playerId, otherPlayers = [], otherPlayersId = [];

createScene();
createLights();

gameLoop();

function createScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x222233, 0, 20000);
    clock = new THREE.Clock(true);
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function createLights() {
    var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    var sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.color.setHSL(0.1, 1, 0.95);
    sun.position.set(-1, 1.75, 1);
    sun.position.multiplyScalar(50);
    scene.add(sun);

    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    var d = 30;

    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;

    sun.shadow.camera.far = 500;
    sun.shadow.bias = -0.000001;
}

function loadModels(data) {

    var manager = new THREE.LoadingManager();

    for (let i = 0; i < data.length; i++) {
        let obj = data[i].split('.')[0];
        models.push('/public/models/NaturePack/' + obj);
    }

    manager.onProgress = function (item, loaded, total) {
        //console.log(item, loaded, total);
    };
    manager.onLoad = function () {
        socket.emit('loadComplete');
    };
    /** LOADING MTL & OBJ **/
    for (let key in models) {
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.load(models[key] + '.mtl', function (materials) {
            materials.preload();
            var objLoader = new THREE.OBJLoader(manager);
            objLoader.setMaterials(materials);
            objLoader.load(models[key] + '.obj', function (mesh) {
                mesh.traverse(function (node) {
                    if (node instanceof THREE.Mesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });
                mesh.name = models[key].split('/')[4];
                objects.push(mesh);
            });
        });
    }
}

function createWorld(data) {
    data.map((m) => {
        let elem = objects.find(e => e.name == m.path).clone();
        elem.position.set(m.position.x, m.position.y, m.position.z);
        elem.rotation.set(radians(m.rotation.x), radians(m.rotation.y), radians(m.rotation.z));
        elem.scale.set(m.scale.x, m.scale.y, m.scale.z);
        elem.castShadow = true;
        elem.receiveShadow = true;
        scene.add(elem);
    });

    document.getElementById('root').appendChild(renderer.domElement);
}

function createPlayer(data) {
    player = new THREE.Mesh(
        new THREE.BoxGeometry(data.size.x, data.size.y, data.size.z),
        new THREE.MeshLambertMaterial({ color: 0x7777ff })
    );

    player.name = 'player';
    player.castShadow = true;
    player.receiveShadow = true;

    player.rotation.set(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
    );

    player.position.set(
        data.position.x,
        data.position.y,
        data.position.z
    );

    playerId = data.playerId;
    updateCameraPosition();
    scene.add(player);
    camera.lookAt(player.position);
}

function addOtherPlayer(data) {
    var otherPlayer = new THREE.Mesh(
        new THREE.BoxGeometry(data.size.x, data.size.y, data.size.z),
        new THREE.MeshLambertMaterial({ color: 0x7777ff })
    );

    otherPlayer.castShadow = true;
    otherPlayer.receiveShadow = true;
    otherPlayer.name = 'others';

    otherPlayer.rotation.set(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z
    );

    otherPlayer.position.set(
        data.position.x,
        data.position.y,
        data.position.z
    );

    otherPlayersId.push(data.playerId);
    otherPlayers.push(otherPlayer);
    scene.add(otherPlayer);
}

function removeOtherPlayer(data) {
    scene.remove(playerForId(data.playerId));

    var j = otherPlayers.indexOf(playerForId(data.playerId));
    if (j != -1)
        otherPlayers.splice(j, 1);
    var k = otherPlayersId.indexOf(data.playerId);
    if (k != -1)
        otherPlayersId.splice(k, 1);
}

function checkKeyStates(data) {
    console.log('inputs', data.inputs);
    var playerMesh = playerForId(data.playerId) || player;
    if(playerMesh) {
        if (data.inputs[38] || data.inputs[90]) {
            // up arrow or 'w' - move forward
            playerMesh.position.z = data.position.z - data.stats.speed * timeElapsed;
        }
        if (data.inputs[40] || data.inputs[83]) {
            // down arrow or 's' - move backward
            playerMesh.position.z = data.position.z + data.stats.speed * timeElapsed;
        }
        if (data.inputs[81] || data.inputs[37]) {
            // left arrow or 'q' - strafe left
            playerMesh.position.x = data.position.x - data.stats.speed * timeElapsed;
        }
        if (data.inputs[68] || data.inputs[39]) {
            // right arrow or 'd' - strage right
            playerMesh.position.x = data.position.x + data.stats.speed * timeElapsed;
        }
        updatePlayerData();
        updateCameraPosition();
    }
}

function updatePlayerData() {
    let data = {
        'playerId': playerId,
        'position': {
            'x': player.position.x,
            'y': player.position.y,
            'z': player.position.z
        },
        'rotation': {
            'x': player.rotation.x,
            'y': player.rotation.y,
            'z': player.rotation.z
        }
    };

    socket.emit('updatePosition', data);
}

function updateCameraPosition() {
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + 10;
    camera.position.z = player.position.z + 5;
}

var playerForId = function (id) {
    var index;
    for (var i = 0; i < otherPlayersId.length; i++) {
        if (otherPlayersId[i] == id) {
            index = i;
            break;
        }
    }
    return otherPlayers[index];
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function gameLoop() {
    timeElapsed = clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}