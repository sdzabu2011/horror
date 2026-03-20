class PlayerManager {
  constructor() { this.players = new Map(); }
  addPlayer(data) { this.players.set(data.id, data); }
  removePlayer(id) { this.players.delete(id); }
  getPlayer(id) { return this.players.get(id); }
  getAllPlayers() { return Array.from(this.players.values()); }
  getAlivePlayers() { return this.getAllPlayers().filter(p => p.isAlive); }
  getPlayerCount() { return this.players.size; }
}

module.exports = PlayerManager;