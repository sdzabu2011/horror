const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const GameManager = require('./game/GameManager');
const PlayerManager = require('./game/PlayerManager');
const WorldManager = require('./game/WorldManager');
const LeaderboardManager = require('./game/LeaderboardManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, '../public')));

const gameManager = new GameManager();
const playerManager = new PlayerManager();
const worldManager = new WorldManager();
const leaderboardManager = new LeaderboardManager();

worldManager.generateWorld();

const activePlayers = new Map();
const registeredUsernames = new Set();
const buildings = new Map();
const voiceUsers = new Set();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('register', (data) => {
    const { username } = data;
    if (!username || username.trim().length < 2) {
      socket.emit('registerResult', { success: false, message: 'Username must be at least 2 characters!' });
      return;
    }
    if (username.trim().length > 16) {
      socket.emit('registerResult', { success: false, message: 'Username must be 16 characters or less!' });
      return;
    }
    if (registeredUsernames.has(username.toLowerCase())) {
      socket.emit('registerResult', { success: false, message: 'Username already taken!' });
      return;
    }

    const playerId = uuidv4();
    const spawnPoint = worldManager.getRandomSpawnPoint();

    const playerData = {
      id: playerId,
      socketId: socket.id,
      username: username.trim(),
      position: spawnPoint,
      rotation: { x: 0, y: 0, z: 0 },
      health: 100, stamina: 100, hunger: 100, sanity: 100,
      inventory: [],
      isAlive: true,
      currentNight: 1,
      score: 0,
      coins: 0,
      kills: 0,
      flashlightOn: false,
      isRunning: false,
      animation: 'idle',
      weapons: ['fists'],
      currentWeapon: 'fists',
      woodCount: 0
    };

    activePlayers.set(socket.id, playerData);
    registeredUsernames.add(username.toLowerCase());
    playerManager.addPlayer(playerData);

    socket.emit('registerResult', {
      success: true,
      player: playerData,
      worldData: worldManager.getWorldData(),
      existingPlayers: Array.from(activePlayers.values()).filter(p => p.socketId !== socket.id),
      buildings: Array.from(buildings.values()),
      onlineCount: activePlayers.size
    });

    socket.broadcast.emit('playerJoined', { player: playerData });
    io.emit('onlineCount', { count: activePlayers.size });
  });

  // Movement
  socket.on('playerMove', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.isAlive) return;
    player.position = data.position;
    player.rotation = data.rotation;
    player.animation = data.animation || 'idle';
    player.isRunning = data.isRunning || false;

    socket.broadcast.emit('playerMoved', {
      id: player.id, position: player.position,
      rotation: player.rotation, animation: player.animation,
      isRunning: player.isRunning, currentWeapon: player.currentWeapon
    });
  });

  // Flashlight
  socket.on('toggleFlashlight', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    player.flashlightOn = !player.flashlightOn;
    io.emit('flashlightToggled', { id: player.id, flashlightOn: player.flashlightOn });
  });

  // Chat
  socket.on('chatMessage', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    io.emit('chatMessage', { username: player.username, message: data.message.substring(0, 200), timestamp: Date.now() });
  });

  // Item pickup
  socket.on('pickupItem', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    const item = worldManager.pickupItem(data.itemId, player.id);
    if (item) {
      if (item.type === 'wood') {
        player.woodCount = (player.woodCount || 0) + 1;
      }
      player.inventory.push(item);
      socket.emit('itemPickedUp', { item, woodCount: player.woodCount });
      socket.broadcast.emit('itemRemoved', { itemId: data.itemId });
    }
  });

  // Use item
  socket.on('useItem', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    const itemIndex = player.inventory.findIndex(i => i.id === data.itemId);
    if (itemIndex === -1) return;
    const item = player.inventory[itemIndex];
    const result = gameManager.useItem(player, item);
    if (result.consumed) {
      player.inventory.splice(itemIndex, 1);
      if (item.type === 'wood') player.woodCount = Math.max(0, (player.woodCount || 0) - 1);
    }
    socket.emit('itemUsed', {
      itemId: data.itemId, result,
      playerStats: { health: player.health, stamina: player.stamina, hunger: player.hunger, sanity: player.sanity }
    });
  });

  // Attack monster
  socket.on('attackMonster', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player || !player.isAlive) return;

    const result = gameManager.damageMonster(data.monsterId, data.damage, player);
    if (result) {
      io.emit('monsterDamaged', { monsterId: data.monsterId, damage: data.damage, killed: result.killed });
      if (result.killed) {
        const coinReward = result.isBoss ? 100 : 20;
        const scoreReward = result.isBoss ? 500 : 50;
        player.coins += coinReward;
        player.score += scoreReward;
        player.kills++;
        socket.emit('coinUpdate', { coins: player.coins, earned: coinReward });
        socket.emit('scoreUpdate', { score: player.score });

        if (result.isBoss) {
          io.emit('announcement', { message: `🏆 ${player.username} defeated the BOSS!` });
        }
      }
    }
  });

  // Player damage
  socket.on('playerDamaged', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    player.health = Math.max(0, player.health - data.damage);
    if (player.health <= 0) {
      player.isAlive = false;
      leaderboardManager.addScore(player.username, player.score, player.currentNight, player.kills);
      io.emit('playerDied', { id: player.id, username: player.username, cause: data.cause });
    }
    socket.emit('statsUpdate', { health: player.health, stamina: player.stamina, hunger: player.hunger, sanity: player.sanity });
  });

  // Night progression
  socket.on('nightComplete', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    player.currentNight++;
    player.score += 100 * player.currentNight;
    player.coins += 10 * player.currentNight;
    socket.emit('nightProgression', { currentNight: player.currentNight, score: player.score });
    socket.emit('coinUpdate', { coins: player.coins, earned: 10 * player.currentNight });
    io.emit('announcement', { message: `${player.username} survived night ${player.currentNight - 1}!` });
  });

  // Building
  socket.on('placeBuild', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    const buildCosts = {
      wood_wall: 3, wood_floor: 2, wood_door: 4,
      wood_stairs: 5, spike_trap: 6, campfire_build: 5
    };

    const cost = buildCosts[data.type] || 3;
    if ((player.woodCount || 0) < cost) {
      socket.emit('buildResult', { success: false, message: `Need ${cost} wood!` });
      return;
    }

    player.woodCount -= cost;

    // Remove wood from inventory
    let removed = 0;
    player.inventory = player.inventory.filter(item => {
      if (item.type === 'wood' && removed < cost) { removed++; return false; }
      return true;
    });

    const buildId = uuidv4();
    const building = {
      id: buildId, type: data.type,
      position: data.position, rotation: data.rotation,
      owner: player.id, health: 100
    };

    buildings.set(buildId, building);

    io.emit('buildingPlaced', building);
    socket.emit('buildResult', { success: true, woodCount: player.woodCount });
  });

  socket.on('demolishBuild', (data) => {
    const building = buildings.get(data.buildingId);
    if (building) {
      buildings.delete(data.buildingId);
      io.emit('buildingRemoved', { id: data.buildingId });
    }
  });

  // Shop
  socket.on('shopBuy', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;

    const prices = {
      knife: 50, axe: 100, torch: 30, pistol: 200, shotgun: 400,
      medkit: 40, food: 20, energy_drink: 25, sanity_pill: 35,
      flare: 30, battery: 15, ammo_pistol: 30, ammo_shotgun: 50,
      wood_bundle: 40, metal_parts: 80
    };

    const price = prices[data.itemId];
    if (!price || player.coins < price) {
      socket.emit('shopResult', { success: false, message: 'Not enough coins!' });
      return;
    }

    player.coins -= price;

    const weaponTypes = ['knife', 'axe', 'torch', 'pistol', 'shotgun'];
    if (weaponTypes.includes(data.itemId)) {
      if (!player.weapons.includes(data.itemId)) {
        player.weapons.push(data.itemId);
      }
      socket.emit('weaponUnlocked', { weapon: data.itemId });
    } else if (data.itemId === 'wood_bundle') {
      player.woodCount += 10;
      for (let i = 0; i < 10; i++) {
        player.inventory.push({ id: uuidv4(), type: 'wood', name: 'Firewood' });
      }
    } else if (data.itemId === 'ammo_pistol' || data.itemId === 'ammo_shotgun') {
      socket.emit('ammoReceived', { type: data.itemId === 'ammo_pistol' ? 'pistol' : 'shotgun' });
    } else {
      const item = { id: uuidv4(), type: data.itemId, name: data.itemId.replace(/_/g, ' ') };
      player.inventory.push(item);
      socket.emit('itemPickedUp', { item, woodCount: player.woodCount });
    }

    socket.emit('shopResult', { success: true, coins: player.coins });
    socket.emit('coinUpdate', { coins: player.coins });
  });

  // Trading
  socket.on('tradeRequest', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    const targetSocket = Array.from(activePlayers.entries()).find(([, p]) => p.id === data.targetId);
    if (targetSocket) {
      io.to(targetSocket[0]).emit('tradeIncoming', { from: player.username, fromId: player.id });
    }
  });

  socket.on('tradeAccept', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    socket.emit('tradeStarted', { with: data.fromId });
    const targetSocket = Array.from(activePlayers.entries()).find(([, p]) => p.id === data.fromId);
    if (targetSocket) {
      io.to(targetSocket[0]).emit('tradeStarted', { with: player.id });
    }
  });

  socket.on('tradeOffer', (data) => {
    const targetSocket = Array.from(activePlayers.entries()).find(([, p]) => p.id === data.targetId);
    if (targetSocket) {
      io.to(targetSocket[0]).emit('tradeOfferReceived', data);
    }
  });

  // Leaderboard
  socket.on('getLeaderboard', () => {
    socket.emit('leaderboardData', { scores: leaderboardManager.getTopScores(10) });
  });

  // Voice chat signaling
  socket.on('voiceJoin', () => {
    voiceUsers.add(socket.id);
    socket.broadcast.emit('voiceUserJoined', { userId: socket.id });
    voiceUsers.forEach(userId => {
      if (userId !== socket.id) {
        socket.emit('voiceUserJoined', { userId });
      }
    });
  });

  socket.on('voiceLeave', () => {
    voiceUsers.delete(socket.id);
    socket.broadcast.emit('voiceUserLeft', { userId: socket.id });
  });

  socket.on('voiceOffer', (data) => {
    io.to(data.to).emit('voiceOffer', { from: socket.id, offer: data.offer });
  });

  socket.on('voiceAnswer', (data) => {
    io.to(data.to).emit('voiceAnswer', { from: socket.id, answer: data.answer });
  });

  socket.on('voiceIceCandidate', (data) => {
    io.to(data.to).emit('voiceIceCandidate', { from: socket.id, candidate: data.candidate });
  });

  // Weapon switch
  socket.on('weaponSwitch', (data) => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    player.currentWeapon = data.weapon;
    socket.broadcast.emit('playerWeaponChanged', { id: player.id, weapon: data.weapon });
  });

  // Respawn
  socket.on('respawn', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    const spawnPoint = worldManager.getRandomSpawnPoint();
    player.position = spawnPoint;
    player.health = 100; player.stamina = 100; player.hunger = 100; player.sanity = 100;
    player.isAlive = true; player.inventory = []; player.currentNight = 1;
    player.woodCount = 0; player.weapons = ['fists']; player.currentWeapon = 'fists';
    socket.emit('respawned', { player });
    socket.broadcast.emit('playerRespawned', { id: player.id, position: player.position });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const player = activePlayers.get(socket.id);
    if (player) {
      console.log(`Player disconnected: ${player.username}`);
      leaderboardManager.addScore(player.username, player.score, player.currentNight, player.kills);
      registeredUsernames.delete(player.username.toLowerCase());
      playerManager.removePlayer(player.id);
      activePlayers.delete(socket.id);
      voiceUsers.delete(socket.id);
      io.emit('playerLeft', { id: player.id });
      io.emit('onlineCount', { count: activePlayers.size });
      socket.broadcast.emit('voiceUserLeft', { userId: socket.id });
    }
  });
});

// Game loop
const TICK_RATE = 100;
setInterval(() => {
  const gameState = gameManager.update(activePlayers, worldManager);

  for (const [socketId, player] of activePlayers) {
    if (!player.isAlive) continue;

    player.hunger = Math.max(0, player.hunger - 0.02);

    if (gameState.isNight) {
      player.sanity = Math.max(0, player.sanity - 0.03);
    } else {
      player.sanity = Math.min(100, player.sanity + 0.05);
    }

    if (!player.isRunning) {
      player.stamina = Math.min(100, player.stamina + 0.1);
    } else {
      player.stamina = Math.max(0, player.stamina - 0.15);
    }

    if (player.hunger <= 0) player.health = Math.max(0, player.health - 0.05);
    if (player.sanity <= 20) player.health = Math.max(0, player.health - 0.02);

    if (player.health <= 0 && player.isAlive) {
      player.isAlive = false;
      leaderboardManager.addScore(player.username, player.score, player.currentNight, player.kills);
      io.to(socketId).emit('playerDied', {
        id: player.id, username: player.username,
        cause: player.hunger <= 0 ? 'starvation' : 'insanity'
      });
    }

    io.to(socketId).emit('statsUpdate', {
      health: Math.round(player.health * 10) / 10,
      stamina: Math.round(player.stamina * 10) / 10,
      hunger: Math.round(player.hunger * 10) / 10,
      sanity: Math.round(player.sanity * 10) / 10
    });
  }

  io.emit('gameStateUpdate', {
    timeOfDay: gameState.timeOfDay,
    isNight: gameState.isNight,
    currentNightGlobal: gameState.currentNight,
    weather: gameState.weather,
    monsterPositions: gameState.monsterPositions,
    bossActive: gameState.bossActive
  });

}, TICK_RATE);

// Spawn items
setInterval(() => {
  const newItems = worldManager.spawnRandomItems();
  if (newItems.length > 0) {
    io.emit('itemsSpawned', { items: newItems });
  }
}, 30000);

// Coins for surviving (every 30 seconds)
setInterval(() => {
  for (const [socketId, player] of activePlayers) {
    if (!player.isAlive) continue;
    player.coins += 2;
    io.to(socketId).emit('coinUpdate', { coins: player.coins, earned: 2 });
  }
}, 30000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌲 99 Nights in the Forest v2.0 running on port ${PORT}`);
});