class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.callbacks = {};
  }

  connect() {
    this.socket = io({
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => { this.connected = true; this.trigger('connected'); });
    this.socket.on('disconnect', () => { this.connected = false; this.trigger('disconnected'); });
    this.socket.on('reconnect', () => { this.trigger('connected'); });

    const events = [
      'registerResult', 'playerJoined', 'playerLeft', 'playerMoved',
      'flashlightToggled', 'gameStateUpdate', 'statsUpdate', 'chatMessage',
      'itemPickedUp', 'itemRemoved', 'itemsSpawned', 'itemUsed',
      'playerDied', 'playerRespawned', 'nightProgression', 'announcement',
      'respawned', 'onlineCount', 'coinUpdate', 'scoreUpdate',
      'buildingPlaced', 'buildingRemoved', 'buildResult',
      'shopResult', 'weaponUnlocked', 'ammoReceived',
      'monsterDamaged', 'playerWeaponChanged',
      'leaderboardData', 'tradeIncoming', 'tradeStarted',
      'voiceOffer', 'voiceAnswer', 'voiceIceCandidate',
      'voiceUserJoined', 'voiceUserLeft'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => this.trigger(event, data));
    });
  }

  register(u) { if (this.socket && this.connected) this.socket.emit('register', { username: u }); }
  sendMovement(p, r, a, ir) { if (this.socket && this.connected) this.socket.volatile.emit('playerMove', { position: p, rotation: r, animation: a, isRunning: ir }); }
  toggleFlashlight() { if (this.socket) this.socket.emit('toggleFlashlight'); }
  sendChatMessage(m) { if (this.socket) this.socket.emit('chatMessage', { message: m }); }
  pickupItem(id) { if (this.socket) this.socket.emit('pickupItem', { itemId: id }); }
  useItem(id) { if (this.socket) this.socket.emit('useItem', { itemId: id }); }
  sendDamage(d, c) { if (this.socket) this.socket.emit('playerDamaged', { damage: d, cause: c }); }
  requestRespawn() { if (this.socket) this.socket.emit('respawn'); }

  on(event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
  }

  trigger(event, data) {
    if (this.callbacks[event]) this.callbacks[event].forEach(cb => cb(data));
  }
}