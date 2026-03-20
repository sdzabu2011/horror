class LeaderboardUI {
  constructor(networkManager) {
    this.network = networkManager;
    this.isOpen = false;
    this.scores = [];
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.network.socket.emit('getLeaderboard');
    }
    this.updateUI();
    return this.isOpen;
  }

  close() {
    this.isOpen = false;
    this.updateUI();
  }

  setScores(scores) {
    this.scores = scores;
    this.updateUI();
  }

  updateUI() {
    const panel = document.getElementById('leaderboard-panel');
    if (!panel) return;

    panel.style.display = this.isOpen ? 'block' : 'none';

    if (!this.isOpen) return;

    let html = `<div class="lb-header">
      <h3>🏆 LEADERBOARD</h3>
      <button class="lb-close" onclick="game.leaderboard.close()">✕</button>
    </div>
    <div class="lb-list">`;

    if (this.scores.length === 0) {
      html += '<div class="lb-empty">No scores yet. Survive to get on the board!</div>';
    }

    this.scores.forEach((score, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      html += `<div class="lb-entry ${index < 3 ? 'lb-top' : ''}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-name">${score.username}</span>
        <span class="lb-score">${score.score} pts</span>
        <span class="lb-details">Night ${score.nightsSurvived} | ${score.monstersKilled} kills</span>
      </div>`;
    });

    html += '</div>';

    const content = panel.querySelector('.lb-content');
    if (content) content.innerHTML = html;
  }
}