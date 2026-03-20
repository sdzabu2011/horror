class Forest {
  constructor(scene) {
    this.scene = scene;
    this.trees = [];
    this.rocks = [];
    this.ground = null;
    this.colliders = [];

    this.groundTexture = Helpers.createGroundTexture();
    this.groundTexture.wrapS = THREE.RepeatWrapping;
    this.groundTexture.wrapT = THREE.RepeatWrapping;
    this.groundTexture.repeat.set(20, 20);

    this.barkTexture = Helpers.createBarkTexture();
    this.leavesTexture = Helpers.createLeavesTexture();
    this.rockTexture = Helpers.createRockTexture();
  }

  buildWorld(worldData) {
    this.createGround(worldData.worldSize);
    this.createTrees(worldData.trees);
    this.createRocks(worldData.rocks);
    this.createStructures(worldData.structures);
    this.createCampfires(worldData.campfires);
    this.createItems(worldData.items);
    this.addAtmosphericDetails();
  }

  createGround(worldSize) {
    const groundGeo = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2, 64, 64);
    const vertices = groundGeo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i + 2] += (Math.random() - 0.5) * 0.5;
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.groundTexture, roughness: 0.9, metalness: 0.0, color: 0x2a3a1a
    });

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  createTrees(treesData) {
    treesData.forEach(treeData => {
      const tree = this.createTree(treeData);
      this.trees.push(tree);
      this.scene.add(tree);
      this.colliders.push({
        position: { x: treeData.position.x, z: treeData.position.z },
        radius: 0.8
      });
    });
  }

  createTree(data) {
    const group = new THREE.Group();
    const scale = data.scale || 1;

    if (data.type === 'pine') {
      const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 6 * scale, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ map: this.barkTexture, color: 0x4a3520, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 3 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      const foliageMat = new THREE.MeshStandardMaterial({ map: this.leavesTexture, color: 0x0a4a0a, roughness: 0.8 });
      for (let i = 0; i < 4; i++) {
        const fSize = (4 - i) * 0.6 * scale;
        const fHeight = (2.5 + i * 1.5) * scale;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(fSize, 2.5 * scale, 8), foliageMat);
        cone.position.y = fHeight;
        cone.castShadow = true;
        group.add(cone);
      }
    } else {
      const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 4 * scale, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ map: this.barkTexture, color: 0x3a2510, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2 * scale;
      trunk.castShadow = true;
      group.add(trunk);

      const foliageMat = new THREE.MeshStandardMaterial({ map: this.leavesTexture, color: 0x1a5a1a, roughness: 0.8 });
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(2.5 * scale, 8, 8), foliageMat);
      foliage.position.y = 5.5 * scale;
      foliage.castShadow = true;
      group.add(foliage);

      for (let i = 0; i < 3; i++) {
        const extra = new THREE.Mesh(new THREE.SphereGeometry(1.5 * scale, 6, 6), foliageMat);
        const angle = (i / 3) * Math.PI * 2;
        extra.position.set(Math.cos(angle) * 1.5 * scale, 4.5 * scale + Math.random() * scale, Math.sin(angle) * 1.5 * scale);
        extra.castShadow = true;
        group.add(extra);
      }
    }

    group.position.set(data.position.x, 0, data.position.z);
    group.rotation.y = data.rotation || 0;
    return group;
  }

  createRocks(rocksData) {
    rocksData.forEach(rockData => {
      const rock = this.createRock(rockData);
      this.rocks.push(rock);
      this.scene.add(rock);
      if (rockData.scale > 0.8) {
        this.colliders.push({ position: { x: rockData.position.x, z: rockData.position.z }, radius: rockData.scale });
      }
    });
  }

  createRock(data) {
    const scale = data.scale || 1;
    let geo = data.type === 'boulder' ? new THREE.DodecahedronGeometry(scale, 1) : new THREE.OctahedronGeometry(scale * 0.7, 0);
    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      vertices[i] += (Math.random() - 0.5) * scale * 0.3;
      vertices[i + 1] += (Math.random() - 0.5) * scale * 0.2;
      vertices[i + 2] += (Math.random() - 0.5) * scale * 0.3;
    }
    geo.computeVertexNormals();

    const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: this.rockTexture, color: 0x666666, roughness: 0.9, metalness: 0.1 }));
    rock.position.set(data.position.x, scale * 0.3, data.position.z);
    rock.rotation.set(Math.random() * 0.3, data.rotation || 0, Math.random() * 0.3);
    rock.castShadow = true;
    rock.receiveShadow = true;
    return rock;
  }

  createStructures(structuresData) {
    structuresData.forEach(structure => {
      const mesh = this.createStructure(structure);
      this.scene.add(mesh);
      this.colliders.push({ position: { x: structure.position.x, z: structure.position.z }, radius: 4 });
    });
  }

  createStructure(data) {
    const group = new THREE.Group();
    switch (data.type) {
      case 'cabin': this.buildCabin(group); break;
      case 'ruins': this.buildRuins(group); break;
      case 'tent': this.buildTent(group); break;
      case 'watchtower': this.buildWatchtower(group); break;
      case 'cave_entrance': this.buildCaveEntrance(group); break;
    }
    group.position.set(data.position.x, 0, data.position.z);
    group.rotation.y = data.rotation || 0;
    return group;
  }

  buildCabin(group) {
    const wallMat = new THREE.MeshStandardMaterial({ map: this.barkTexture, color: 0x5a4030, roughness: 0.9 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), wallMat);
    base.position.y = 1.5; base.castShadow = true; group.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2, 4), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 }));
    roof.position.y = 4; roof.rotation.y = Math.PI / 4; roof.castShadow = true; group.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x2a1a0a }));
    door.position.set(0, 1, 2.55); group.add(door);
  }

  buildRuins(group) {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.95 });
    for (let i = 0; i < 4; i++) {
      const h = 1 + Math.random() * 2;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(4, h, 0.3), wallMat);
      const a = (i / 4) * Math.PI * 2;
      wall.position.set(Math.cos(a) * 3, h / 2, Math.sin(a) * 3);
      wall.rotation.y = a; wall.castShadow = true; group.add(wall);
    }
  }

  buildTent(group) {
    const tent = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.5, 4), new THREE.MeshStandardMaterial({ color: 0x4a6a3a, roughness: 0.7, side: THREE.DoubleSide }));
    tent.position.y = 1.25; tent.rotation.y = Math.PI / 4; tent.castShadow = true; group.add(tent);
  }

  buildWatchtower(group) {
    const woodMat = new THREE.MeshStandardMaterial({ map: this.barkTexture, color: 0x5a4030, roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), woodMat);
      leg.position.set(Math.cos(a) * 2, 4, Math.sin(a) * 2); leg.castShadow = true; group.add(leg);
    }
    const platform = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 5), woodMat);
    platform.position.y = 7; platform.castShadow = true; group.add(platform);
  }

  buildCaveEntrance(group) {
    const rockMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, color: 0x444444, roughness: 0.95 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + Math.random() * 0.5, 0), rockMat);
      rock.position.set(Math.cos(a) * 3, Math.sin(a) * 3, 0); rock.castShadow = true; group.add(rock);
    }
    const interior = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    interior.position.z = -0.5; interior.position.y = 2; group.add(interior);
  }

  createCampfires(campfiresData) { this.campfirePositions = campfiresData; }

  // =============================================
  // REALISTIC 3D ITEM MESHES (NOT CUBES!)
  // =============================================

  createItems(itemsData) {
    this.itemMeshes = new Map();
    itemsData.forEach(item => { this.addItemMesh(item); });
  }

  addItemMesh(item) {
    let mesh;

    switch (item.type) {
      case 'medkit': mesh = this.createMedkitMesh(); break;
      case 'food': mesh = this.createFoodCanMesh(); break;
      case 'energy_drink': mesh = this.createEnergyDrinkMesh(); break;
      case 'sanity_pill': mesh = this.createPillBottleMesh(); break;
      case 'flare': mesh = this.createFlareMesh(); break;
      case 'battery': mesh = this.createBatteryMesh(); break;
      case 'wood': mesh = this.createWoodMesh(); break;
      case 'key': mesh = this.createKeyMesh(); break;
      default: mesh = this.createGenericMesh(); break;
    }

    mesh.position.set(item.position.x, item.position.y || 0.5, item.position.z);
    mesh.userData = { itemId: item.id, type: item.type, name: item.name, baseY: item.position.y || 0.5 };

    // Glow sphere around item
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8),
      new THREE.MeshBasicMaterial({ color: this.getItemColor(item.type), transparent: true, opacity: 0.1 })
    );
    mesh.add(glow);

    // Small point light
    const light = new THREE.PointLight(this.getItemColor(item.type), 0.3, 5);
    light.position.y = 0.3;
    mesh.add(light);

    this.scene.add(mesh);
    this.itemMeshes.set(item.id, mesh);
  }

  // MEDKIT - White box with red cross
  createMedkitMesh() {
    const group = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 })
    );
    group.add(box);
    const crossH = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.08, 0.21),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.2 })
    );
    crossH.position.z = 0.001;
    group.add(crossH);
    const crossV = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.22, 0.21),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.2 })
    );
    crossV.position.z = 0.001;
    group.add(crossV);
    // Handle on top
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.03, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5 })
    );
    handle.position.y = 0.19;
    group.add(handle);
    return group;
  }

  // FOOD - Silver can with orange label
  createFoodCanMesh() {
    const group = new THREE.Group();
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.7, roughness: 0.3 })
    );
    group.add(can);
    // Label band
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.125, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6 })
    );
    label.position.y = -0.02;
    group.add(label);
    // Top lid
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 })
    );
    lid.position.y = 0.16;
    group.add(lid);
    // Pull tab
    const tab = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.01, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 })
    );
    tab.position.set(0, 0.17, 0.02);
    group.add(tab);
    return group;
  }

  // ENERGY DRINK - Tall thin can, green/yellow
  createEnergyDrinkMesh() {
    const group = new THREE.Group();
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x88ff00, roughness: 0.4, metalness: 0.5 })
    );
    group.add(can);
    // Top
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.07, 0.03, 16),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
    );
    top.position.y = 0.2;
    group.add(top);
    // Lightning bolt stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.2, 0.075),
      new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.3 })
    );
    stripe.position.z = 0.065;
    stripe.rotation.z = 0.3;
    group.add(stripe);
    return group;
  }

  // SANITY PILLS - Pill bottle
  createPillBottleMesh() {
    const group = new THREE.Group();
    // Bottle body
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 0.25, 8),
      new THREE.MeshStandardMaterial({ color: 0x8833cc, roughness: 0.4, transparent: true, opacity: 0.85 })
    );
    group.add(bottle);
    // White cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.06, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    cap.position.y = 0.155;
    group.add(cap);
    // Label
    const label = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.1, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    label.position.y = -0.02;
    group.add(label);
    return group;
  }

  // FLARE - Red stick with glowing tip
  createFlareMesh() {
    const group = new THREE.Group();
    // Stick body
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.6 })
    );
    stick.rotation.z = Math.PI / 6;
    group.add(stick);
    // Glowing tip
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.8 })
    );
    tip.position.set(0.09, 0.16, 0);
    group.add(tip);
    // Tip glow light
    const tipLight = new THREE.PointLight(0xff4400, 0.5, 3);
    tipLight.position.copy(tip.position);
    group.add(tipLight);
    return group;
  }

  // BATTERY - Green cylinder with metal ends
  createBatteryMesh() {
    const group = new THREE.Group();
    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.22, 12),
      new THREE.MeshStandardMaterial({ color: 0x22aa22, roughness: 0.4 })
    );
    group.add(body);
    // Positive end (bump)
    const posEnd = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
    );
    posEnd.position.y = 0.13;
    group.add(posEnd);
    // Negative end (flat)
    const negEnd = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
    );
    negEnd.position.y = -0.12;
    group.add(negEnd);
    // Gold stripe
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.057, 0.057, 0.03, 12),
      new THREE.MeshStandardMaterial({ color: 0xddaa00, metalness: 0.6 })
    );
    stripe.position.y = 0.05;
    group.add(stripe);
    // Rotate to lay on side
    group.rotation.z = Math.PI / 2;
    return group;
  }

  // WOOD - Log shape
  createWoodMesh() {
    const group = new THREE.Group();
    // Main log
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.5, 8),
      new THREE.MeshStandardMaterial({ map: this.barkTexture, color: 0x6b4226, roughness: 0.9 })
    );
    log.rotation.z = Math.PI / 2;
    group.add(log);
    // End rings (visible wood grain)
    const end1 = new THREE.Mesh(
      new THREE.CircleGeometry(0.07, 8),
      new THREE.MeshStandardMaterial({ color: 0xc4a56e, roughness: 0.7 })
    );
    end1.rotation.y = Math.PI / 2;
    end1.position.x = 0.25;
    group.add(end1);
    const end2 = new THREE.Mesh(
      new THREE.CircleGeometry(0.09, 8),
      new THREE.MeshStandardMaterial({ color: 0xc4a56e, roughness: 0.7 })
    );
    end2.rotation.y = -Math.PI / 2;
    end2.position.x = -0.25;
    group.add(end2);
    // Small branch stub
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.1, 4),
      new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.9 })
    );
    branch.position.set(0.05, 0.08, 0);
    branch.rotation.z = -0.5;
    group.add(branch);
    return group;
  }

  // KEY - Gold key shape
  createKeyMesh() {
    const group = new THREE.Group();
    // Handle (ring)
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.02, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2, emissive: 0xffd700, emissiveIntensity: 0.15 })
    );
    handle.position.y = 0.15;
    group.add(handle);
    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.2, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
    );
    shaft.position.y = -0.03;
    group.add(shaft);
    // Teeth
    const teeth1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.02, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
    );
    teeth1.position.set(0.015, -0.1, 0);
    group.add(teeth1);
    const teeth2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.02, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 })
    );
    teeth2.position.set(0.005, -0.06, 0);
    group.add(teeth2);
    return group;
  }

  // Fallback generic item
  createGenericMesh() {
    return new THREE.Mesh(
      new THREE.OctahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2 })
    );
  }

  removeItemMesh(itemId) {
    const mesh = this.itemMeshes.get(itemId);
    if (mesh) {
      this.scene.remove(mesh);
      this.itemMeshes.delete(itemId);
    }
  }

  getItemColor(type) {
    const colors = {
      medkit: 0xff0000, food: 0xff8800, energy_drink: 0x88ff00,
      sanity_pill: 0x8833cc, flare: 0xff4400, battery: 0x22aa22,
      wood: 0x6b4226, key: 0xffd700
    };
    return colors[type] || 0xffffff;
  }

  addAtmosphericDetails() {
    this.fogParticles = [];
    const fogGeo = new THREE.PlaneGeometry(5, 5);
    const fogMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false });

    for (let i = 0; i < 50; i++) {
      const fog = new THREE.Mesh(fogGeo, fogMat.clone());
      fog.position.set((Math.random() - 0.5) * 150, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 150);
      fog.rotation.x = -Math.PI / 2;
      fog.rotation.z = Math.random() * Math.PI;
      fog.userData.speed = 0.1 + Math.random() * 0.3;
      fog.userData.originalX = fog.position.x;
      this.fogParticles.push(fog);
      this.scene.add(fog);
    }
  }

  update(delta, timeOfDay) {
    const time = Date.now() * 0.001;

    // Animate items: float and rotate
    this.itemMeshes.forEach((mesh) => {
      const baseY = mesh.userData.baseY || 0.5;
      mesh.position.y = baseY + Math.sin(time * 2 + mesh.position.x) * 0.15;
      mesh.rotation.y += delta * 1.5;
    });

    // Animate fog
    if (this.fogParticles) {
      this.fogParticles.forEach(fog => {
        fog.position.x = fog.userData.originalX + Math.sin(time * fog.userData.speed) * 5;
        fog.material.opacity = timeOfDay > 0.75 || timeOfDay < 0.25 ? 0.15 : 0.05;
      });
    }
  }

  checkCollision(position, radius) {
    for (const collider of this.colliders) {
      const dx = position.x - collider.position.x;
      const dz = position.z - collider.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius + collider.radius) return true;
    }
    return false;
  }

  getNearbyItem(position, range) {
    let nearest = null;
    let nearestDist = range;

    this.itemMeshes.forEach((mesh, itemId) => {
      const dist = Helpers.distance2D(position, mesh.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { itemId, type: mesh.userData.type, name: mesh.userData.name, distance: dist };
      }
    });

    return nearest;
  }
}