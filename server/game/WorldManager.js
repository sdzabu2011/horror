const { v4: uuidv4 } = require('uuid');

class WorldManager {
  constructor() {
    this.trees = [];
    this.rocks = [];
    this.items = [];
    this.campfires = [];
    this.structures = [];
    this.worldSize = 400; // BIGGER MAP
    this.spawnPoints = [];
    this.biomes = [];
  }

  generateWorld() {
    console.log('🌍 Generating LARGE world with biomes...');

    this.generateBiomes();
    this.generateTrees(1200);
    this.generateRocks(200);
    this.generateCampfires(15);
    this.generateStructures(12);
    this.generateSpawnPoints(15);
    this.spawnInitialItems();

    console.log(`🌲 World generated: ${this.trees.length} trees, ${this.rocks.length} rocks, ${this.biomes.length} biomes`);
  }

  generateBiomes() {
    const biomeTypes = ['dense_forest', 'swamp', 'rocky_mountain', 'dead_forest', 'meadow', 'dark_woods'];

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const radius = 40 + Math.random() * 120;

      this.biomes.push({
        id: `biome_${i}`,
        type: biomeTypes[i % biomeTypes.length],
        center: { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius },
        radius: 30 + Math.random() * 40,
        treeColor: this.getBiomeTreeColor(biomeTypes[i % biomeTypes.length]),
        groundColor: this.getBiomeGroundColor(biomeTypes[i % biomeTypes.length]),
        fogDensity: this.getBiomeFogDensity(biomeTypes[i % biomeTypes.length])
      });
    }
  }

  getBiomeTreeColor(type) {
    return { dense_forest: 0x0a4a0a, swamp: 0x2a4a2a, rocky_mountain: 0x1a3a1a, dead_forest: 0x3a2a1a, meadow: 0x2a6a2a, dark_woods: 0x050a05 }[type] || 0x0a4a0a;
  }

  getBiomeGroundColor(type) {
    return { dense_forest: 0x2a3a1a, swamp: 0x1a2a1a, rocky_mountain: 0x4a4a3a, dead_forest: 0x2a1a0a, meadow: 0x3a5a2a, dark_woods: 0x0a0a05 }[type] || 0x2a3a1a;
  }

  getBiomeFogDensity(type) {
    return { dense_forest: 0.015, swamp: 0.04, rocky_mountain: 0.01, dead_forest: 0.025, meadow: 0.008, dark_woods: 0.035 }[type] || 0.015;
  }

  getBiomeAt(x, z) {
    let closest = null;
    let closestDist = Infinity;

    for (const biome of this.biomes) {
      const dx = x - biome.center.x;
      const dz = z - biome.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < closestDist && dist < biome.radius) {
        closestDist = dist;
        closest = biome;
      }
    }

    return closest;
  }

  generateTrees(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 10 + Math.random() * (this.worldSize / 2 - 10);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const biome = this.getBiomeAt(x, z);
      let treeType = Math.random() > 0.3 ? 'pine' : 'oak';

      if (biome) {
        if (biome.type === 'dead_forest') treeType = 'dead';
        if (biome.type === 'swamp') treeType = Math.random() > 0.5 ? 'willow' : 'pine';
        if (biome.type === 'meadow' && Math.random() > 0.3) continue; // Fewer trees in meadow
      }

      this.trees.push({
        id: `tree_${i}`,
        position: { x, y: 0, z },
        type: treeType,
        scale: 0.8 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        biome: biome ? biome.type : 'default'
      });
    }
  }

  generateRocks(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.worldSize / 2);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const biome = this.getBiomeAt(x, z);
      let scale = 0.3 + Math.random() * 1.5;
      if (biome && biome.type === 'rocky_mountain') scale *= 2;

      this.rocks.push({
        id: `rock_${i}`,
        position: { x, y: 0, z },
        scale,
        type: Math.random() > 0.5 ? 'boulder' : 'stone',
        rotation: Math.random() * Math.PI * 2
      });
    }
  }

  generateCampfires(count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 20 + Math.random() * 80;
      this.campfires.push({
        id: `campfire_${i}`,
        position: { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius },
        isLit: Math.random() > 0.4,
        fuel: 50 + Math.random() * 50,
        safeRadius: 12
      });
    }
  }

  generateStructures(count) {
    const types = ['cabin', 'ruins', 'tent', 'watchtower', 'cave_entrance', 'abandoned_car', 'shrine', 'bunker'];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 30 + Math.random() * 100;
      this.structures.push({
        id: `structure_${i}`,
        position: { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius },
        type: types[i % types.length],
        rotation: Math.random() * Math.PI * 2,
        hasLoot: true
      });
    }
  }

  generateSpawnPoints(count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 15 + Math.random() * 30;
      this.spawnPoints.push({ x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius });
    }
  }

  spawnInitialItems() {
    const itemTypes = [
      { type: 'medkit', name: 'Medical Kit', rarity: 0.25 },
      { type: 'food', name: 'Canned Food', rarity: 0.45 },
      { type: 'energy_drink', name: 'Energy Drink', rarity: 0.35 },
      { type: 'sanity_pill', name: 'Sanity Pills', rarity: 0.2 },
      { type: 'flare', name: 'Flare', rarity: 0.3 },
      { type: 'battery', name: 'Battery', rarity: 0.4 },
      { type: 'wood', name: 'Firewood', rarity: 0.5 },
      { type: 'key', name: 'Mysterious Key', rarity: 0.05 }
    ];

    for (let i = 0; i < 80; i++) {
      const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      if (Math.random() > itemType.rarity) continue;

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.worldSize / 2);

      this.items.push({
        id: uuidv4(), type: itemType.type, name: itemType.name,
        position: { x: Math.cos(angle) * radius, y: 0.5, z: Math.sin(angle) * radius },
        pickedUp: false, pickedUpBy: null
      });
    }
  }

  spawnRandomItems() {
    const newItems = [];
    const itemTypes = [
      { type: 'food', name: 'Canned Food' },
      { type: 'battery', name: 'Battery' },
      { type: 'wood', name: 'Firewood' },
      { type: 'medkit', name: 'Medical Kit' }
    ];

    const numItems = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numItems; i++) {
      const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.worldSize / 2);

      const item = {
        id: uuidv4(), type: itemType.type, name: itemType.name,
        position: { x: Math.cos(angle) * radius, y: 0.5, z: Math.sin(angle) * radius },
        pickedUp: false, pickedUpBy: null
      };
      this.items.push(item);
      newItems.push(item);
    }
    return newItems;
  }

  pickupItem(itemId, playerId) {
    const item = this.items.find(i => i.id === itemId && !i.pickedUp);
    if (item) { item.pickedUp = true; item.pickedUpBy = playerId; return { ...item }; }
    return null;
  }

  getRandomSpawnPoint() {
    return { ...this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)] };
  }

  getWorldData() {
    return {
      trees: this.trees, rocks: this.rocks, campfires: this.campfires,
      structures: this.structures, items: this.items.filter(i => !i.pickedUp),
      worldSize: this.worldSize, biomes: this.biomes
    };
  }
}

module.exports = WorldManager;