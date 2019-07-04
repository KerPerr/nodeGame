var stats, scene, clock, timeElapsed, camera;
var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

var models = [], objects = [];
var player, playerId, otherPlayers = [], otherPlayersId = [], colliders = [];
var keyState = {};
var rays = [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(1, 0, 1),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(1, 0, -1),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(-1, 0, -1),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(-1, 0, 1),
    new THREE.Vector3(0, -1, 0)
];
var caster = new THREE.Raycaster();
var canHit = true;

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
    otherPlayers = [], otherPlayersId = [], colliders = [];
    data.map((m) => {
        let elem = objects.find(e => e.name == m.path).clone();
        elem.position.set(m.position.x, m.position.y, m.position.z);
        elem.rotation.set(radians(m.rotation.x), radians(m.rotation.y), radians(m.rotation.z));
        elem.scale.set(m.scale.x, m.scale.y, m.scale.z);
        elem.castShadow = true;
        elem.receiveShadow = true;
        colliders.push(elem);
        scene.add(elem);
    });

    document.getElementById('root').appendChild(renderer.domElement);
}

function createPlayer(data) {
    playerData = data;
    
        player = new THREE.Mesh(
            new THREE.BoxGeometry(data.sizeX, data.sizeY, data.sizeZ),
            new THREE.MeshLambertMaterial({ color: 0x7777ff })
        );
        rightHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.25),
            new THREE.MeshLambertMaterial({ color: 0x7777ff })
        );
        leftHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.25),
            new THREE.MeshLambertMaterial({ color: 0x7777ff })
        );
    
        rightHand.position.set(.5, 0, 0);
        leftHand.position.set(-.5, 0, 0);
        rightHand.name = 'right';
        leftHand.name = 'left';
        leftHand.castShadow = true;
        rightHand.castShadow = true;
        player.add(leftHand);
        player.add(rightHand);
    
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
        moveSpeed = data.stats.speed;
    
        updateCameraPosition();
    
        scene.add(player);
    
        camera.lookAt(player.position);
}

function playerCollision() {
    if(player) {
        var collisions, i, distance = .75;
        // For each ray
        for (i = 0; i < rays.length; i += 1) {
            // We reset the raycaster to this direction
            caster.set(player.position, rays[i]);
            // Test if we intersect with any obstacle mesh
            collisions = caster.intersectObjects(colliders, true);
            // And disable that direction if we do
            if (collisions.length > 0 && collisions[0].distance <= distance) {
                // Yep, this.rays[i] gives us : 0 => up, 1 => up-left, 2 => left, ...
                if (i === 0 || i === 1 || i === 7) {
                    player.position.z = collisions[0].point.z - distance;
                    updatePlayerData();
                    socket.emit('updatePosition', playerData);
                }
                if (i === 4 || i === 3 || i === 5) {
                    player.position.z = collisions[0].point.z + distance;
                    updatePlayerData();
                    socket.emit('updatePosition', playerData);
                }
                if (i === 2 || i === 1 || i === 3) {
                    player.position.x = collisions[0].point.x - distance;
                    updatePlayerData();
                    socket.emit('updatePosition', playerData);
                }
                if (i === 6 || i === 5 || i === 7) {
                    player.position.x = collisions[0].point.x + distance;
                    updatePlayerData();
                    socket.emit('updatePosition', playerData);
                }
                if (i === 8) {
                    player.position.y = collisions[0].point.y + 0.5;
                    updatePlayerData();
                    socket.emit('updatePosition', playerData);
                }
            }
        }
    }
};

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

function onMouseUp() {}

function onMouseDown() {
    event.preventDefault();
    let intersects = calculateIntersects(event);
    switch (event.button) {
        case 0:
            console.log('Primary');
            socket.emit('playerAtk', playerData);
            break;
        case 1:
            console.log('Roll');
            break;
        case 2:
            console.log('Secondary');
            if (intersects.length > 0) {
                let distance = Math.sqrt(
                    Math.pow(intersects[0].object.parent.position.x - player.position.x, 2)
                    +
                    Math.pow(intersects[0].object.parent.position.z - player.position.z, 2)
                );
                console.log(intersects[0]);
                console.log(distance);
                //If object is intersected by mouse pointer, do something
                if (intersects[0].object && distance < 1.20) {
                    console.log('Can talk');
                }
            }
            break;
    }
}

function onMouseMove() {
    if (player) {
        // update the mouse variable
        var mouseVector = new THREE.Vector3(
            (event.clientX / window.innerWidth) * 2 - 1,
            - (event.clientY / window.innerHeight) * 2 + 1,
            0.5
        );
        mouseVector.unproject(camera);
        let dir = mouseVector.sub(camera.position).normalize();
        let distance = - camera.position.y / dir.y;
        let pos = camera.position.clone().add(dir.multiplyScalar(distance));
        let diffX = pos.x - player.position.x;
        let diffZ = pos.z - player.position.z;
        let angle = Math.atan2(diffZ, diffX);
        player.rotation.y = -(angle + Math.PI / 2);
        updatePlayerData();
        socket.emit('updatePosition', playerData);
    }
}

function onKeyDown(event) {
    //event = event || window.event;
    keyState[event.keyCode || event.which] = true;
}

function onKeyUp(event) {
    //event = event || window.event;
    keyState[event.keyCode || event.which] = false;
}

function checkKeyStates() {
    if (keyState[38] || keyState[90]) {
        // up arrow or 'w' - move forward
        player.position.z -= moveSpeed * timeElapsed;
        updatePlayerData();
        updateCameraPosition();
    }
    if (keyState[40] || keyState[83]) {
        // down arrow or 's' - move backward
        player.position.z += moveSpeed * timeElapsed;
        updatePlayerData();
        updateCameraPosition();
    }
    if (keyState[81] || keyState[37]) {
        // left arrow or 'q' - strafe left
        player.position.x -= moveSpeed * timeElapsed;
        updatePlayerData();
        updateCameraPosition();
    }
    if (keyState[68] || keyState[39]) {
        // right arrow or 'd' - strage right
        player.position.x += moveSpeed * timeElapsed;
        updatePlayerData();
        updateCameraPosition();
    }
}

function playerAttack(data) {
    console.log(data);
    var hit = [];
    var somePlayer = playerForId(data.playerId) || player;
    if (canHit) {
        canHit = false;

        var tween = new TWEEN.Tween(somePlayer.children[1].position)
            .to({ x: 0.3, y: 0, z: -1 }, 200)
            .easing(TWEEN.Easing.Sinusoidal.Out);
        tween.start();

        tween.onUpdate(() => {
            hit.push(attackCollision(rightHand));
        });

        tween.onComplete(() => {
            somePlayer.children[1].position.set(.5, 0, 0);
            if (hit.includes(true)) { console.log('Hit'); }
            canHit = true;
        });
    }
}

var attackCollision = function (weapon) {
    var collisions, i, distance = 0.25;
    var ray = new THREE.Raycaster();
    // For each ray
    for (i = 0; i < rays.length; i += 1) {
        // We reset the raycaster to this direction
        ray.set(weapon.getWorldPosition(new THREE.Vector3()), rays[i]);
        // Test if we intersect with any obstacle mesh
        collisions = ray.intersectObjects(colliders, true);
        // And disable that direction if we do
        let target = collisions.find(o => o.object.name == 'others');
        if (target && target.distance <= distance) {
            console.log('Hited', playerForId(target.id))    ;
            socket.emit('AttackHit', target);
            return true;
        }
    }
};

function calculateIntersects(event) {
    //Determine objects intersected by raycaster
    event.preventDefault();
    let mouse = new THREE.Raycaster();
    let vector = new THREE.Vector3();
    vector.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1, 0.5);
    vector.unproject(camera);
    mouse.ray.set(camera.position, vector.sub(camera.position).normalize());
    var intersects = mouse.intersectObjects(colliders, true);
    return intersects;
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

function updatePlayerPosition(data) {
    var somePlayer = playerForId(data.playerId);
    if (somePlayer) {
        console.log('UPDATE', somePlayer);
        somePlayer.rotation.set(
            data.rotation.x,
            data.rotation.y,
            data.rotation.z
        );

        somePlayer.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
    }
}

function updateCameraPosition() {
    if(camera && player) {
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + 10;
        camera.position.z = player.position.z + 5;
    }
}

function playerForId(id) {
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
    TWEEN.update();
    checkKeyStates();
    playerCollision();
    timeElapsed = clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}
