class LeaderboardManager {
  constructor() {
    this.scores = [];
    this.maxEntries = 50;
  }

  addScore(username, score, nightsSurvived, monstersKilled) {
    this.scores.push({
      username,
      score,
      nightsSurvived,
      monstersKilled,
      timestamp: Date.now()
    });

    this.scores.sort((a, b) => b.score - a.score);

    if (this.scores.length > this.maxEntries) {
      this.scores = this.scores.slice(0, this.maxEntries);
    }
  }

  getTopScores(count) {
    return this.scores.slice(0, count || 10);
  }

  getPlayerBest(username) {
    return this.scores
      .filter(s => s.username.toLowerCase() === username.toLowerCase())
      .sort((a, b) => b.score - a.score)[0] || null;
  }
}

module.exports = LeaderboardManager;