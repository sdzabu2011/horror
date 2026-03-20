class WeaponSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.currentWeapon = null;
    this.weaponMesh = null;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.weaponBob = 0;

    this.weapons = {
      fists: { name: 'Fists', damage: 5, range: 2, speed: 0.3, emoji: '👊', ammo: -1 },
      knife: { name: 'Knife', damage: 15, range: 2.5, speed: 0.25, emoji: '🔪', ammo: -1 },
      axe: { name: 'Axe', damage: 30, range: 3, speed: 0.6, emoji: '🪓', ammo: -1 },
      torch: { name: 'Torch', damage: 10, range: 3, speed: 0.4, emoji: '🔦', ammo: -1, scareRange: 8 },
      pistol: { name: 'Pistol', damage: 40, range: 30, speed: 0.5, emoji: '🔫', ammo: 12, maxAmmo: 12 },
      shotgun: { name: 'Shotgun', damage: 80, range: 15, speed: 1.0, emoji: '💥', ammo: 6, maxAmmo: 6 }
    };

    this.equippedWeapons = ['fists'];
    this.selectedIndex = 0;
    this.equipWeapon('fists');
  }

  equipWeapon(type) {
    if (!this.weapons[type]) return;
    this.currentWeapon = type;
    this.removeWeaponMesh();
    this.createWeaponMesh(type);
    this.updateWeaponUI();
  }

  addWeapon(type) {
    if (!this.equippedWeapons.includes(type)) {
      this.equippedWeapons.push(type);
    }
    if (this.weapons[type] && this.weapons[type].ammo > 0) {
      this.weapons[type].ammo = this.weapons[type].maxAmmo;
    }
    this.updateWeaponUI();
  }

  removeWeaponMesh() {
    if (this.weaponMesh) {
      this.camera.remove(this.weaponMesh);
      this.weaponMesh = null;
    }
  }

  createWeaponMesh(type) {
    const group = new THREE.Group();

    switch (type) {
      case 'knife':
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.2, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 })
        );
        blade.position.y = 0.1;
        group.add(blade);
        const kHandle = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.08, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.8 })
        );
        group.add(kHandle);
        break;

      case 'axe':
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.02, 0.5, 6),
          new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.8 })
        );
        group.add(shaft);
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.08, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 })
        );
        head.position.y = 0.22;
        group.add(head);
        break;

      case 'torch':
        const tStick = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.025, 0.4, 6),
          new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 })
        );
        group.add(tStick);
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xff6600 })
        );
        flame.position.y = 0.22;
        group.add(flame);
        const tLight = new THREE.PointLight(0xff6600, 1, 8);
        tLight.position.y = 0.22;
        group.add(tLight);
        break;

      case 'pistol':
        const pBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.06, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 })
        );
        group.add(pBody);
        const pGrip = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 0.08, 0.04),
          new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.8 })
        );
        pGrip.position.set(0, -0.06, -0.04);
        pGrip.rotation.x = -0.3;
        group.add(pGrip);
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6),
          new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = 0.11;
        group.add(barrel);
        break;

      case 'shotgun':
        const sBody = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.05, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.6, roughness: 0.3 })
        );
        group.add(sBody);
        const sStock = new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.06, 0.15),
          new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 })
        );
        sStock.position.z = -0.25;
        group.add(sStock);
        const sBarrel1 = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.15, 6),
          new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
        );
        sBarrel1.rotation.x = Math.PI / 2;
        sBarrel1.position.set(0.012, 0.01, 0.27);
        group.add(sBarrel1);
        const sBarrel2 = sBarrel1.clone();
        sBarrel2.position.x = -0.012;
        group.add(sBarrel2);
        break;

      default: // fists
        const fist = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.6 })
        );
        group.add(fist);
        break;
    }

    group.position.set(0.25, -0.2, -0.4);
    group.rotation.set(0, 0, 0);
    this.weaponMesh = group;
    this.camera.add(group);
  }

  attack() {
    if (this.isAttacking || this.attackCooldown > 0) return null;

    const weapon = this.weapons[this.currentWeapon];
    if (!weapon) return null;

    if (weapon.ammo === 0) return { error: 'No ammo!' };
    if (weapon.ammo > 0) weapon.ammo--;

    this.isAttacking = true;
    this.attackCooldown = weapon.speed;

    this.playAttackAnimation();

    return {
      type: this.currentWeapon,
      damage: weapon.damage,
      range: weapon.range,
      scareRange: weapon.scareRange || 0
    };
  }

  playAttackAnimation() {
    if (!this.weaponMesh) return;

    const startRot = this.weaponMesh.rotation.x;
    const startPos = this.weaponMesh.position.z;
    const weapon = this.weapons[this.currentWeapon];

    if (weapon && (this.currentWeapon === 'pistol' || this.currentWeapon === 'shotgun')) {
      this.weaponMesh.position.z += 0.05;
      setTimeout(() => {
        if (this.weaponMesh) this.weaponMesh.position.z = startPos;
      }, 100);
    } else {
      this.weaponMesh.rotation.x = -0.8;
      setTimeout(() => {
        if (this.weaponMesh) this.weaponMesh.rotation.x = startRot;
      }, 200);
    }

    setTimeout(() => { this.isAttacking = false; }, (weapon ? weapon.speed : 0.3) * 1000);
  }

  update(delta, isMoving) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.weaponMesh && isMoving) {
      this.weaponBob += delta * 6;
      this.weaponMesh.position.y = -0.2 + Math.sin(this.weaponBob) * 0.01;
      this.weaponMesh.position.x = 0.25 + Math.cos(this.weaponBob * 0.5) * 0.005;
    }
  }

  cycleWeapon(direction) {
    this.selectedIndex += direction;
    if (this.selectedIndex < 0) this.selectedIndex = this.equippedWeapons.length - 1;
    if (this.selectedIndex >= this.equippedWeapons.length) this.selectedIndex = 0;
    this.equipWeapon(this.equippedWeapons[this.selectedIndex]);
  }

  updateWeaponUI() {
    const el = document.getElementById('weapon-display');
    if (!el) return;

    const w = this.weapons[this.currentWeapon];
    if (!w) return;

    let ammoText = w.ammo === -1 ? '∞' : `${w.ammo}/${w.maxAmmo}`;
    el.innerHTML = `${w.emoji} ${w.name} | Ammo: ${ammoText}`;
  }

  getCurrentWeaponData() {
    return this.weapons[this.currentWeapon];
  }
}