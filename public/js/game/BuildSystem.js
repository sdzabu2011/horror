class BuildSystem {
  constructor(scene, networkManager) {
    this.scene = scene;
    this.network = networkManager;
    this.buildings = new Map();
    this.isBuilding = false;
    this.selectedBuild = null;
    this.previewMesh = null;
    this.buildRange = 8;

    this.buildTypes = {
      wood_wall: { name: 'Wood Wall', cost: 3, emoji: '🧱', width: 3, height: 2.5, depth: 0.2, color: 0x6b4226, health: 100 },
      wood_floor: { name: 'Wood Floor', cost: 2, emoji: '🟫', width: 3, height: 0.1, depth: 3, color: 0x8b5a2b, health: 80 },
      wood_door: { name: 'Wood Door', cost: 4, emoji: '🚪', width: 1.2, height: 2.2, depth: 0.15, color: 0x5a3a1a, health: 60 },
      wood_stairs: { name: 'Wood Stairs', cost: 5, emoji: '🪜', width: 1.5, height: 2, depth: 3, color: 0x7a4a2a, health: 70 },
      spike_trap: { name: 'Spike Trap', cost: 6, emoji: '⚔️', width: 2, height: 0.5, depth: 2, color: 0x555555, health: 50 },
      campfire_build: { name: 'Campfire', cost: 5, emoji: '🔥', width: 1, height: 0.5, depth: 1, color: 0x884400, health: 200 }
    };
  }

  toggleBuildMode() {
    this.isBuilding = !this.isBuilding;
    if (!this.isBuilding) {
      this.removePreview();
      this.selectedBuild = null;
    }
    this.updateBuildUI();
    return this.isBuilding;
  }

  selectBuildType(type) {
    if (!this.buildTypes[type]) return;
    this.selectedBuild = type;
    this.removePreview();
    this.createPreview(type);
  }

  createPreview(type) {
    const bt = this.buildTypes[type];
    const geo = new THREE.BoxGeometry(bt.width, bt.height, bt.depth);
    const mat = new THREE.MeshStandardMaterial({
      color: bt.color,
      transparent: true,
      opacity: 0.4,
      wireframe: false
    });
    this.previewMesh = new THREE.Mesh(geo, mat);
    this.previewMesh.position.y = bt.height / 2;

    const wireGeo = new THREE.BoxGeometry(bt.width, bt.height, bt.depth);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, wireframe: true });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    this.previewMesh.add(wire);

    this.scene.add(this.previewMesh);
  }

  removePreview() {
    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh = null;
    }
  }

  updatePreview(playerPos, cameraDir) {
    if (!this.previewMesh || !this.selectedBuild) return;

    const bt = this.buildTypes[this.selectedBuild];
    const placePos = {
      x: playerPos.x + cameraDir.x * 4,
      y: bt.height / 2,
      z: playerPos.z + cameraDir.z * 4
    };

    placePos.x = Math.round(placePos.x * 2) / 2;
    placePos.z = Math.round(placePos.z * 2) / 2;

    this.previewMesh.position.set(placePos.x, placePos.y, placePos.z);
    this.previewMesh.rotation.y = Math.round(Math.atan2(cameraDir.x, cameraDir.z) / (Math.PI / 2)) * (Math.PI / 2);
  }

  placeBuild(playerPos, cameraDir, woodCount) {
    if (!this.selectedBuild) return null;

    const bt = this.buildTypes[this.selectedBuild];
    if (woodCount < bt.cost) return { error: `Need ${bt.cost} wood! (Have ${woodCount})` };

    const pos = {
      x: Math.round((playerPos.x + cameraDir.x * 4) * 2) / 2,
      y: bt.height / 2,
      z: Math.round((playerPos.z + cameraDir.z * 4) * 2) / 2
    };

    const rot = Math.round(Math.atan2(cameraDir.x, cameraDir.z) / (Math.PI / 2)) * (Math.PI / 2);

    return { type: this.selectedBuild, position: pos, rotation: rot, cost: bt.cost };
  }

  addBuilding(data) {
    const bt = this.buildTypes[data.type];
    if (!bt) return;

    const geo = new THREE.BoxGeometry(bt.width, bt.height, bt.depth);
    const mat = new THREE.MeshStandardMaterial({
      color: bt.color,
      roughness: 0.8,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(data.position.x, data.position.y, data.position.z);
    mesh.rotation.y = data.rotation || 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { buildingId: data.id, type: data.type };

    if (data.type === 'campfire_build') {
      const light = new THREE.PointLight(0xff6600, 1.5, 15);
      light.position.y = 1;
      mesh.add(light);
    }

    if (data.type === 'spike_trap') {
      for (let i = 0; i < 5; i++) {
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.05, 0.4, 4),
          new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 })
        );
        spike.position.set((Math.random() - 0.5) * 1.5, 0.3, (Math.random() - 0.5) * 1.5);
        mesh.add(spike);
      }
    }

    this.scene.add(mesh);
    this.buildings.set(data.id, mesh);
  }

  removeBuilding(id) {
    const mesh = this.buildings.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.buildings.delete(id);
    }
  }

  updateBuildUI() {
    const menu = document.getElementById('build-menu');
    if (menu) {
      menu.style.display = this.isBuilding ? 'block' : 'none';
    }

    const indicator = document.getElementById('build-indicator');
    if (indicator) {
      indicator.style.display = this.isBuilding ? 'block' : 'none';
    }
  }

  getColliders() {
    const colliders = [];
    this.buildings.forEach((mesh) => {
      colliders.push({
        position: { x: mesh.position.x, z: mesh.position.z },
        radius: 1.5
      });
    });
    return colliders;
  }
}