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

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server:', this.socket.id);
      this.trigger('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('Disconnected:', reason);
      this.trigger('disconnected');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      this.trigger('connected');
    });

    this.socket.on('reconnect_error', (err) => {
      console.log('Reconnection error');
    });

    // Game events
    const events = [
      'registerResult', 'playerJoined', 'playerLeft', 'playerMoved',
      'flashlightToggled', 'gameStateUpdate', 'statsUpdate', 'chatMessage',
      'itemPickedUp', 'itemRemoved', 'itemsSpawned', 'itemUsed',
      'playerDied', 'playerRespawned', 'nightProgression', 'announcement',
      'respawned'
    ];

    events.forEach(event => {
      this.socket.on(event, (data) => this.trigger(event, data));
    });
  }

  register(username) {
    if (this.socket && this.connected) {
      this.socket.emit('register', { username });
    }
  }

  sendMovement(position, rotation, animation, isRunning) {
    if (this.socket && this.connected) {
      this.socket.volatile.emit('playerMove', { position, rotation, animation, isRunning });
    }
  }

  toggleFlashlight() {
    if (this.socket) this.socket.emit('toggleFlashlight');
  }

  sendChatMessage(message) {
    if (this.socket) this.socket.emit('chatMessage', { message });
  }

  pickupItem(itemId) {
    if (this.socket) this.socket.emit('pickupItem', { itemId });
  }

  useItem(itemId) {
    if (this.socket) this.socket.emit('useItem', { itemId });
  }

  sendDamage(damage, cause) {
    if (this.socket) this.socket.emit('playerDamaged', { damage, cause });
  }

  sendNightComplete() {
    if (this.socket) this.socket.emit('nightComplete');
  }

  requestRespawn() {
    if (this.socket) this.socket.emit('respawn');
  }

  on(event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }
}