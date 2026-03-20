let game = null;

window.addEventListener('load', () => {
  game = new Game();
  game.init();
  game.uiManager.showLogin();

  document.getElementById('username-input').focus();
  document.getElementById('username-input').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') startGame();
  });
});

function startGame() {
  const username = document.getElementById('username-input').value.trim();
  if (!username || username.length < 2 || username.length > 16) {
    document.getElementById('login-error').textContent = 'Username must be 2-16 characters!';
    return;
  }
  document.getElementById('login-error').textContent = '';
  document.getElementById('play-btn').textContent = 'Connecting...';
  document.getElementById('play-btn').disabled = true;
  game.networkManager.register(username);
}

function respawn() { if (game) game.networkManager.requestRespawn(); }