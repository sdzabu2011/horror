class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = new Map();
  }

  updateMonsters(monsterPositions) {
    const activeIds = new Set();

    monsterPositions.forEach(data => {
      activeIds.add(data.id);
      if (this.monsters.has(data.id)) {
        this.updateMonster(data);
      } else {
        this.createMonster(data);
      }
    });

    this.monsters.forEach((monster, id) => {
      if (!activeIds.has(id)) this.removeMonster(id);
    });
  }

  createMonster(data) {
    const group = new THREE.Group();
    let mesh;

    if (data.isBoss) {
      mesh = this.createBossWendigo();
    } else {
      switch (data.type) {
        case 'wendigo': mesh = this.createWendigo(); break;
        case 'shadow': mesh = this.createShadow(); break;
        case 'crawler': mesh = this.createCrawler(); break;
        case 'ghost': mesh = this.createGhost(); break;
        default: mesh = this.createShadow(); break;
      }
    }

    group.add(mesh);

    // Eyes
    const eyeColor = data.isBoss ? 0xff0000 : (data.type === 'ghost' ? 0x44aaff : 0xff0000);
    const eyeSize = data.isBoss ? 0.15 : 0.08;
    const eyeGeo = new THREE.SphereGeometry(eyeSize, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeY = data.type === 'crawler' ? 0.5 : (data.isBoss ? 4.5 : 1.7);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15 * (data.isBoss ? 2 : 1), eyeY, 0.3);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15 * (data.isBoss ? 2 : 1), eyeY, 0.3);
    group.add(rightEye);

    // Light
    const light = new THREE.PointLight(data.isBoss ? 0xff0000 : (data.type === 'ghost' ? 0x4444ff : 0xff0000), data.isBoss ? 2 : 0.5, data.isBoss ? 20 : 8);
    light.position.y = 1;
    group.add(light);

    // Boss health bar
    if (data.isBoss) {
      const hpBarBg = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.3), new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide }));
      hpBarBg.position.y = 6;
      hpBarBg.name = 'hpBarBg';
      group.add(hpBarBg);

      const hpBar = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.2), new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide }));
      hpBar.position.y = 6;
      hpBar.position.z = 0.01;
      hpBar.name = 'hpBar';
      group.add(hpBar);
    }

    group.position.set(data.position.x, data.position.y || 0, data.position.z);

    this.scene.add(group);
    this.monsters.set(data.id, { group, type: data.type, state: data.state, isBoss: data.isBoss, mesh, leftEye, rightEye });
  }

  createBossWendigo() {
    const group = new THREE.Group();
    const scale = 2.5;

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a0a0a, roughness: 0.9, emissive: 0x110000, emissiveIntensity: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1 * scale, 3 * scale, 0.6 * scale), bodyMat);
    body.position.y = 2.5 * scale;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8 * scale, 1 * scale, 0.7 * scale), new THREE.MeshStandardMaterial({ color: 0x2a1a1a, emissive: 0x110000, emissiveIntensity: 0.1 }));
    head.position.y = 4.5 * scale;
    group.add(head);

    // Horns
    for (let side = -1; side <= 1; side += 2) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1 * scale, 1.5 * scale, 6), new THREE.MeshStandardMaterial({ color: 0x4a3a2a, metalness: 0.3 }));
      horn.position.set(side * 0.4 * scale, 5.5 * scale, 0);
      horn.rotation.z = side * 0.4;
      group.add(horn);

      const horn2 = new THREE.Mesh(new THREE.ConeGeometry(0.06 * scale, 0.8 * scale, 4), new THREE.MeshStandardMaterial({ color: 0x4a3a2a }));
      horn2.position.set(side * 0.6 * scale, 5.2 * scale, 0.1);
      horn2.rotation.z = side * 0.7;
      group.add(horn2);
    }

    // Arms
    for (let side = -1; side <= 1; side += 2) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2 * scale, 2.5 * scale, 0.2 * scale), bodyMat);
      arm.position.set(side * 0.7 * scale, 2 * scale, 0);
      arm.rotation.z = side * -0.3;
      arm.name = side === -1 ? 'leftArm' : 'rightArm';
      group.add(arm);

      // Claws
      for (let c = 0; c < 3; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.03 * scale, 0.3 * scale, 4), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 }));
        claw.position.set(side * 0.7 * scale + (c - 1) * 0.06, 0.6 * scale, 0.1);
        claw.rotation.x = -0.3;
        group.add(claw);
      }
    }

    // Legs
    for (let side = -1; side <= 1; side += 2) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 1.5 * scale, 0.3 * scale), bodyMat);
      leg.position.set(side * 0.3 * scale, 0.75 * scale, 0);
      leg.name = side === -1 ? 'leftLeg' : 'rightLeg';
      group.add(leg);
    }

    return group;
  }

  createWendigo() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a1a1a, roughness: 0.9 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.3), bodyMat);
    body.position.y = 1.5; group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.35), new THREE.MeshStandardMaterial({ color: 0x3a2a2a }));
    head.position.y = 2.7; group.add(head);

    for (let side = -1; side <= 1; side += 2) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), bodyMat);
      arm.position.set(side * 0.4, 1.2, 0); arm.rotation.z = side * -0.3;
      arm.name = side === -1 ? 'leftArm' : 'rightArm';
      group.add(arm);
    }

    for (let side = -1; side <= 1; side += 2) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), bodyMat);
      leg.position.set(side * 0.15, 0.3, 0);
      leg.name = side === -1 ? 'leftLeg' : 'rightLeg';
      group.add(leg);

      const antler = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.8, 4), new THREE.MeshStandardMaterial({ color: 0x4a3a2a }));
      antler.position.set(side * 0.2, 3, 0); antler.rotation.z = side * 0.4;
      group.add(antler);
    }
    return group;
  }

  createShadow() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x050505, transparent: true, opacity: 0.7 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), mat);
    body.position.y = 1; body.scale.set(1, 1.5, 0.8); group.add(body);
    for (let i = 0; i < 4; i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.15, 1.5, 4), mat);
      const a = (i / 4) * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.4, 0.3, Math.sin(a) * 0.4);
      group.add(t);
    }
    return group;
  }

  createCrawler() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 1.2), mat);
    body.position.y = 0.3; group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mat);
    head.position.set(0, 0.4, 0.7); group.add(head);
    for (let s = -1; s <= 1; s += 2) {
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 4), mat);
        leg.position.set(s * 0.5, 0.15, -0.3 + i * 0.4); leg.rotation.z = s * 0.5;
        leg.name = `leg_${s}_${i}`;
        group.add(leg);
      }
    }
    return group;
  }

  createGhost() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8888cc, transparent: true, opacity: 0.4, emissive: 0x222244, emissiveIntensity: 0.3 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 2, 8), mat);
    body.position.y = 1; group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mat);
    head.position.y = 2.2; group.add(head);
    return group;
  }

  updateMonster(data) {
    const monster = this.monsters.get(data.id);
    if (!monster) return;

    const targetPos = new THREE.Vector3(data.position.x, data.position.y || 0, data.position.z);
    monster.group.position.lerp(targetPos, 0.1);

    const time = Date.now() * 0.003;

    // Chase animations
    if (data.state === 'chasing' || data.state === 'attacking') {
      const animSpeed = data.state === 'attacking' ? 3 : 2;

      monster.group.children.forEach(child => {
        if (child.name === 'leftArm') {
          child.rotation.x = Math.sin(time * animSpeed) * 0.8;
        }
        if (child.name === 'rightArm') {
          child.rotation.x = -Math.sin(time * animSpeed) * 0.8;
        }
        if (child.name === 'leftLeg') {
          child.rotation.x = -Math.sin(time * animSpeed) * 0.6;
        }
        if (child.name === 'rightLeg') {
          child.rotation.x = Math.sin(time * animSpeed) * 0.6;
        }
      });

      // Crawler legs
      if (data.type === 'crawler') {
        monster.group.children.forEach(child => {
          if (child.name && child.name.startsWith('leg_')) {
            child.rotation.x = Math.sin(time * 4 + parseInt(child.name.split('_')[2]) * 2) * 0.4;
          }
        });
      }
    } else {
      // Idle sway
      monster.group.children.forEach(child => {
        if (child.name === 'leftArm' || child.name === 'rightArm') {
          child.rotation.x = Math.sin(time * 0.5) * 0.05;
        }
        if (child.name === 'leftLeg' || child.name === 'rightLeg') {
          child.rotation.x = 0;
        }
      });
    }

    // Ghost float
    if (data.type === 'ghost') {
      monster.group.position.y += Math.sin(time) * 0.02;
      monster.group.children.forEach(child => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = 0.3 + Math.sin(time * 2) * 0.15;
        }
      });
    }

    // Shadow pulse
    if (data.type === 'shadow') {
      const scale = 1 + Math.sin(time) * 0.1;
      monster.group.scale.set(scale, scale, scale);
    }

    // Boss health bar
    if (data.isBoss) {
      const hpBar = monster.group.getObjectByName('hpBar');
      if (hpBar && data.maxHealth) {
        const hpRatio = data.health / data.maxHealth;
        hpBar.scale.x = Math.max(0.01, hpRatio);
      }

      // Boss body pulse
      if (data.state === 'special_attack') {
        monster.group.scale.setScalar(1 + Math.sin(time * 10) * 0.1);
      } else {
        monster.group.scale.setScalar(1);
      }
    }

    // Eyes glow more when chasing
    if (monster.leftEye && monster.rightEye) {
      const glowIntensity = data.state === 'chasing' ? 1.5 : 1;
      monster.leftEye.scale.setScalar(glowIntensity);
      monster.rightEye.scale.setScalar(glowIntensity);
    }

    monster.state = data.state;
  }

  removeMonster(id) {
    const monster = this.monsters.get(id);
    if (monster) { this.scene.remove(monster.group); this.monsters.delete(id); }
  }

  getNearestMonster(position) {
    let nearest = null;
    let nearestDist = Infinity;

    this.monsters.forEach((monster, id) => {
      const dist = Helpers.distance2D(position, monster.group.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = { id, distance: dist, type: monster.type, state: monster.state, isBoss: monster.isBoss, position: monster.group.position };
      }
    });

    return nearest;
  }

  getMonstersInRange(position, range) {
    const inRange = [];
    this.monsters.forEach((monster, id) => {
      const dist = Helpers.distance2D(position, monster.group.position);
      if (dist < range) {
        inRange.push({ id, distance: dist, type: monster.type, position: monster.group.position });
      }
    });
    return inRange;
  }
}