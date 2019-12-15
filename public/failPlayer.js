class Player extends THREE.Mesh {
    playerData;
    canHit = true;

    rays = [
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
    caster = new THREE.Raycaster();

    constructor(data) {
        super();
        this.playerData = data;

        this.geometry = new THREE.BoxGeometry(data.sizeX, data.sizeY, data.sizeZ);
        this.material = new THREE.MeshLambertMaterial({ color: 0x7777ff });
    
        let rightHand, leftHand;
        rightHand = leftHand = new THREE.Mesh(
            new THREE.BoxGeometry(0.25, 0.25, 0.25),
            new THREE.MeshLambertMaterial({ color: 0x7777ff })
        );

        rightHand.position.set(.5, 0, 0);
        leftHand.position.set(-.5, 0, 0);
        rightHand.name = 'right';
        leftHand.name = 'left';
        leftHand.castShadow = true;
        rightHand.castShadow = true;
        this.add(leftHand);
        this.add(rightHand);
    
        this.name = 'player';
        this.castShadow = true;
        this.receiveShadow = true;
    
        this.rotation.set(
            data.rotation.x,
            data.rotation.y,
            data.rotation.z
        );
    
        this.position.set(
            data.position.x,
            data.position.y,
            data.position.z
        );
    
        this.playerId = data.playerId;
        
        //data.stats.speed;
        console.log('Coucou');

        this.onKeyDown = this.onKeyDown.bind(this);
        window.addEventListener('keydown', this.onKeyDown, false);
        
        this.onKeyUp = this.onKeyUp.bind(this);
		window.addEventListener('keyup', this.onKeyUp, false);
    }

    Collision(colliders) {
        var collisions, i, distance = .75;
        // For each ray
        for (i = 0; i < this.rays.length; i += 1) {
            // We reset the raycaster to this direction
            this.caster.set(this.position, this.rays[i]);
            // Test if we intersect with any obstacle mesh
            collisions = this.caster.intersectObjects(colliders, true);
            // And disable that direction if we do
            if (collisions.length > 0 && collisions[0].distance <= distance) {
                // Yep, this.rays[i] gives us : 0 => up, 1 => up-left, 2 => left, ...
                if (i === 0 || i === 1 || i === 7) {
                    this.position.z = collisions[0].point.z - distance;
                    this.updatePlayerData();
                    socket.emit('updatePosition', this.playerData);
                }
                if (i === 4 || i === 3 || i === 5) {
                    this.position.z = collisions[0].point.z + distance;
                    this.updatePlayerData();
                    socket.emit('updatePosition', this.playerData);
                }
                if (i === 2 || i === 1 || i === 3) {
                    this.position.x = collisions[0].point.x - distance;
                    this.updatePlayerData();
                    socket.emit('updatePosition', this.playerData);
                }
                if (i === 6 || i === 5 || i === 7) {
                    this.position.x = collisions[0].point.x + distance;
                    this.updatePlayerData();
                    socket.emit('updatePosition', this.playerData);
                }
                if (i === 8) {
                    this.position.y = collisions[0].point.y + 0.5;
                    this.updatePlayerData();
                    socket.emit('updatePosition', this.playerData);
                }
            }
        }
    };

    onKeyDown(event) {
        //event = event || window.event;
        keyState[event.keyCode || event.which] = true;
    }

    onKeyUp(event) {
        //event = event || window.event;
        keyState[event.keyCode || event.which] = false;
    }

    checkKeyStates() {
        if (keyState[38] || keyState[90]) {
            // up arrow or 'w' - move forward
            player.position.z -= moveSpeed * timeElapsed;
        }
        if (keyState[40] || keyState[83]) {
            // down arrow or 's' - move backward
            player.position.z += moveSpeed * timeElapsed;
        }
        if (keyState[81] || keyState[37]) {
            // left arrow or 'q' - strafe left
            player.position.x -= moveSpeed * timeElapsed;
        }
        if (keyState[68] || keyState[39]) {
            // right arrow or 'd' - strage right
            player.position.x += moveSpeed * timeElapsed;
        }
        updatePlayerData();
    }

    updatePlayerData() {
        let data = {
            'playerId': this.playerData.playerId,
            'position': { 'x':this.position.x, 'y':this.position.y, 'z':this.position.z },
            'rotation': { 'x':this.rotation.x, 'y':this.rotation.y, 'z':this.rotation.z }
        };
        socket.emit('updatePosition', data);
    }
/*
    onMouseMove() {
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
        let diffX = pos.x - this.position.x;
        let diffZ = pos.z - this.position.z;
        let angle = Math.atan2(diffZ, diffX);
        this.rotation.y = -(angle + Math.PI / 2);
        updatePlayerData();
        socket.emit('updatePosition', playerData);
    }
*/
}