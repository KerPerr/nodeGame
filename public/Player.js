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

		console.log('dataClient', data);

		this.playerData = data;

		this.velocity = {px:0, nx:0, pz:0, nz:0};

		this.geometry = new THREE.BoxGeometry(data.sizeX, data.sizeY, data.sizeZ);
        this.material = new THREE.MeshLambertMaterial({ color: (Math.random() * 0xffffff) });
    
        this.name = data.username;
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

		this.keyDownHandler = this.keyDownHandler.bind(this);
		window.addEventListener("keydown", this.keyDownHandler, false);

		this.keyUpHandler = this.keyUpHandler.bind(this);
		window.addEventListener("keyup", this.keyUpHandler, false);
	}

	update(deltatime) {
		this.position.x += (this.velocity.px + this.velocity.nx) * deltatime;
		this.position.z += (this.velocity.pz + this.velocity.nz) * deltatime;
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
	Collision(colliders) {
		var collisions, i, distance = 1;
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
					this.velocity.pz = 0;
				}
				if (i === 4 || i === 3 || i === 5) {
					this.velocity.nz = 0;
				}
				if (i === 2 || i === 1 || i === 3) {
					this.velocity.px = 0;
				}
				if (i === 6 || i === 5 || i === 7) {
					this.velocity.nx = 0;
				} else {
					this.position.y = 0.5;
				}
			}
		}
	};
*/
    keyDownHandler(event) {
		if(event.keyCode === 90) {
			this.velocity.nz = -this.playerData.stats.speed;
		}
		if(event.keyCode === 83) {
			this.velocity.pz = this.playerData.stats.speed;
		}
		if(event.keyCode === 81) {
			this.velocity.nx = -this.playerData.stats.speed;
		}
		if(event.keyCode === 68) {
			this.velocity.px = this.playerData.stats.speed;
		}
	}

	keyUpHandler(event) {
		if(event.keyCode === 90) {
			this.velocity.nz = 0;
		}
		if(event.keyCode === 83) {
			this.velocity.pz = 0;
		}
		if(event.keyCode === 81) {
			this.velocity.nx = 0;
		}
		if(event.keyCode === 68) {
			this.velocity.px = 0;
		}
	}
    
    umount() {
		window.removeEventListener('keydown', this.keyDownHandler);
		window.removeEventListener('keyup', this.keyUpHandler);
    }
}