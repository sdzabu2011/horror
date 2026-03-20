class GameManager {
  constructor() {
    this.timeOfDay = 0.25;
    this.dayDuration = 420; // 7 minutes
    this.currentNight = 1;
    this.isNight = false;
    this.weather = 'clear';
    this.weatherTimer = 0;
    this.monsters = [];
    this.maxMonsters = 5;
    this.monsterSpawnTimer = 0;
    this.lastUpdate = Date.now();
    this.bossActive = false;
    this.bossSpawned = false;
    this.lastBossNight = 0;
  }

  update(activePlayers, worldManager) {
    const now = Date.now();
    const delta = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    this.timeOfDay += delta / this.dayDuration;
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.currentNight++;

      // Boss every 10 nights
      if (this.currentNight % 10 === 0 && this.currentNight !== this.lastBossNight) {
        this.spawnBoss(worldManager);
        this.lastBossNight = this.currentNight;
      }
    }

    this.isNight = this.timeOfDay > 0.75 || this.timeOfDay < 0.25;

    this.weatherTimer -= delta;
    if (this.weatherTimer <= 0) {
      this.updateWeather();
      this.weatherTimer = 30 + Math.random() * 60;
    }

    this.updateMonsters(delta, activePlayers, worldManager);

    this.bossActive = this.monsters.some(m => m.isBoss);

    return {
      timeOfDay: this.timeOfDay,
      isNight: this.isNight,
      currentNight: this.currentNight,
      weather: this.weather,
      bossActive: this.bossActive,
      monsterPositions: this.monsters.map(m => ({
        id: m.id,
        position: m.position,
        type: m.type,
        state: m.state,
        isBoss: m.isBoss || false,
        health: m.health,
        maxHealth: m.maxHealth || m.health
      }))
    };
  }

  updateWeather() {
    const weathers = ['clear', 'clear', 'clear', 'foggy', 'rainy', 'stormy'];
    if (this.currentNight > 5) weathers.push('stormy', 'foggy');
    this.weather = weathers[Math.floor(Math.random() * weathers.length)];
  }

  updateMonsters(delta, activePlayers, worldManager) {
    if (this.isNight) {
      this.monsterSpawnTimer -= delta;
      if (this.monsterSpawnTimer <= 0 && this.monsters.filter(m => !m.isBoss).length < this.maxMonsters + this.currentNight) {
        this.spawnMonster(worldManager);
        this.monsterSpawnTimer = 10 - Math.min(this.currentNight, 8);
      }
    } else {
      this.monsters = this.monsters.filter(m => m.type === 'shadow' || m.isBoss);
    }

    const playerArray = Array.from(activePlayers.values()).filter(p => p.isAlive);
    this.monsters.forEach(monster => {
      this.updateMonsterAI(monster, playerArray, delta);
    });

    // Remove dead monsters
    this.monsters = this.monsters.filter(m => m.health > 0);
  }

  spawnMonster(worldManager) {
    const types = ['wendigo', 'shadow', 'crawler', 'ghost'];
    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 60;

    this.monsters.push({
      id: `monster_${Date.now()}_${Math.random()}`,
      type, isBoss: false,
      position: { x: Math.cos(angle) * distance, y: type === 'ghost' ? 3 + Math.random() * 5 : 0, z: Math.sin(angle) * distance },
      rotation: { y: 0 },
      speed: this.getMonsterSpeed(type),
      state: 'wandering',
      targetPlayer: null,
      health: this.getMonsterHealth(type),
      maxHealth: this.getMonsterHealth(type),
      damage: this.getMonsterDamage(type),
      detectionRange: this.getMonsterDetection(type),
      attackRange: 3,
      attackCooldown: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      animPhase: Math.random() * Math.PI * 2
    });
  }

  spawnBoss(worldManager) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50;

    const boss = {
      id: `boss_${Date.now()}`,
      type: 'boss_wendigo',
      isBoss: true,
      position: { x: Math.cos(angle) * distance, y: 0, z: Math.sin(angle) * distance },
      rotation: { y: 0 },
      speed: 7,
      state: 'wandering',
      targetPlayer: null,
      health: 500 + this.currentNight * 50,
      maxHealth: 500 + this.currentNight * 50,
      damage: 40,
      detectionRange: 60,
      attackRange: 5,
      attackCooldown: 0,
      wanderAngle: Math.random() * Math.PI * 2,
      animPhase: 0,
      specialAttackTimer: 0
    };

    this.monsters.push(boss);
    console.log(`🧟 BOSS spawned on night ${this.currentNight}!`);
  }

  damageMonster(monsterId, damage, player) {
    const monster = this.monsters.find(m => m.id === monsterId);
    if (!monster) return null;

    monster.health -= damage;
    monster.state = 'chasing';

    if (monster.health <= 0) {
      return { killed: true, isBoss: monster.isBoss || false };
    }
    return { killed: false, isBoss: monster.isBoss || false };
  }

  getMonsterSpeed(type) { return { wendigo: 6, shadow: 4, crawler: 8, ghost: 3 }[type] || 5; }
  getMonsterHealth(type) { return { wendigo: 150, shadow: 80, crawler: 60, ghost: 200 }[type] || 100; }
  getMonsterDamage(type) { return { wendigo: 25, shadow: 15, crawler: 20, ghost: 10 }[type] || 15; }
  getMonsterDetection(type) { return { wendigo: 30, shadow: 20, crawler: 25, ghost: 40 }[type] || 25; }

  updateMonsterAI(monster, players, delta) {
    monster.animPhase += delta * (monster.state === 'chasing' ? 8 : 3);

    if (players.length === 0) { this.monsterWander(monster, delta); return; }

    let nearestPlayer = null;
    let nearestDist = Infinity;

    players.forEach(player => {
      const dx = player.position.x - monster.position.x;
      const dz = player.position.z - monster.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      let detectionMod = 1;
      if (player.flashlightOn && monster.type === 'shadow') detectionMod = 0.5;
      if (player.flashlightOn && monster.type === 'crawler') detectionMod = 1.5;

      if (dist < nearestDist && dist < monster.detectionRange * detectionMod) {
        nearestDist = dist;
        nearestPlayer = player;
      }
    });

    if (nearestPlayer) {
      monster.state = 'chasing';
      monster.targetPlayer = nearestPlayer.id;

      const dx = nearestPlayer.position.x - monster.position.x;
      const dz = nearestPlayer.position.z - monster.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > monster.attackRange) {
        const speed = monster.speed * delta * 0.1;
        monster.position.x += (dx / dist) * speed;
        monster.position.z += (dz / dist) * speed;
        monster.rotation.y = Math.atan2(dx, dz);
      } else {
        monster.state = 'attacking';
      }

      if (monster.type === 'shadow' && Math.random() < 0.002) {
        const a = Math.random() * Math.PI * 2;
        monster.position.x = nearestPlayer.position.x + Math.cos(a) * 15;
        monster.position.z = nearestPlayer.position.z + Math.sin(a) * 15;
      }

      // Boss special attack
      if (monster.isBoss) {
        monster.specialAttackTimer = (monster.specialAttackTimer || 0) + delta;
        if (monster.specialAttackTimer > 5) {
          monster.specialAttackTimer = 0;
          monster.state = 'special_attack';
        }
      }
    } else {
      monster.state = 'wandering';
      monster.targetPlayer = null;
      this.monsterWander(monster, delta);
    }

    if (monster.attackCooldown > 0) monster.attackCooldown -= delta;
  }

  monsterWander(monster, delta) {
    monster.wanderAngle += (Math.random() - 0.5) * 0.1;
    const speed = monster.speed * 0.3 * delta * 0.1;
    monster.position.x += Math.cos(monster.wanderAngle) * speed;
    monster.position.z += Math.sin(monster.wanderAngle) * speed;

    const maxDist = 180;
    const dist = Math.sqrt(monster.position.x ** 2 + monster.position.z ** 2);
    if (dist > maxDist) {
      monster.wanderAngle += Math.PI;
      monster.position.x *= 0.99;
      monster.position.z *= 0.99;
    }
  }

  useItem(player, item) {
    let result = { consumed: false, effect: '' };
    switch (item.type) {
      case 'medkit': player.health = Math.min(100, player.health + 40); result.consumed = true; result.effect = 'healed'; break;
      case 'food': player.hunger = Math.min(100, player.hunger + 30); result.consumed = true; result.effect = 'fed'; break;
      case 'energy_drink': player.stamina = Math.min(100, player.stamina + 50); result.consumed = true; result.effect = 'energized'; break;
      case 'sanity_pill': player.sanity = Math.min(100, player.sanity + 35); result.consumed = true; result.effect = 'calmed'; break;
      case 'flare': result.consumed = true; result.effect = 'flare_used'; break;
      case 'battery': result.consumed = true; result.effect = 'battery_charged'; break;
      case 'wood': result.consumed = true; result.effect = 'wood_used'; break;
      case 'key': result.consumed = false; result.effect = 'key_kept'; break;
    }
    return result;
  }
}

module.exports = GameManager;