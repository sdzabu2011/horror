class Shop {
  constructor(networkManager) {
    this.network = networkManager;
    this.isOpen = false;
    this.coins = 0;
    this.tradeTarget = null;

    this.shopItems = {
      weapons: [
        { id: 'knife', name: 'Knife', price: 50, emoji: '🔪', desc: 'Fast melee weapon' },
        { id: 'axe', name: 'Axe', price: 100, emoji: '🪓', desc: 'Heavy melee damage' },
        { id: 'torch', name: 'Torch', price: 30, emoji: '🔦', desc: 'Scares monsters' },
        { id: 'pistol', name: 'Pistol', price: 200, emoji: '🔫', desc: '12 shots, ranged' },
        { id: 'shotgun', name: 'Shotgun', price: 400, emoji: '💥', desc: 'Powerful close range' }
      ],
      items: [
        { id: 'medkit', name: 'Medkit', price: 40, emoji: '🩹', desc: '+40 Health' },
        { id: 'food', name: 'Food', price: 20, emoji: '🥫', desc: '+30 Hunger' },
        { id: 'energy_drink', name: 'Energy Drink', price: 25, emoji: '⚡', desc: '+50 Stamina' },
        { id: 'sanity_pill', name: 'Sanity Pills', price: 35, emoji: '💊', desc: '+35 Sanity' },
        { id: 'flare', name: 'Flare', price: 30, emoji: '🔥', desc: 'Scares monsters' },
        { id: 'battery', name: 'Battery', price: 15, emoji: '🔋', desc: 'Flashlight power' },
        { id: 'ammo_pistol', name: 'Pistol Ammo', price: 30, emoji: '🔫', desc: '+12 bullets' },
        { id: 'ammo_shotgun', name: 'Shotgun Shells', price: 50, emoji: '💥', desc: '+6 shells' }
      ],
      building: [
        { id: 'wood_bundle', name: 'Wood Bundle (x10)', price: 40, emoji: '🪵', desc: '10 wood pieces' },
        { id: 'metal_parts', name: 'Metal Parts', price: 80, emoji: '⚙️', desc: 'For upgrades' }
      ]
    };
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.updateShopUI();
    return this.isOpen;
  }

  close() {
    this.isOpen = false;
    this.updateShopUI();
  }

  setCoins(amount) {
    this.coins = amount;
    this.updateCoinDisplay();
  }

  addCoins(amount) {
    this.coins += amount;
    this.updateCoinDisplay();
  }

  buyItem(itemId) {
    let item = null;
    for (const category of Object.values(this.shopItems)) {
      item = category.find(i => i.id === itemId);
      if (item) break;
    }

    if (!item) return;
    if (this.coins < item.price) return;

    this.network.socket.emit('shopBuy', { itemId, price: item.price });
  }

  initiateTrade(targetPlayerId) {
    this.tradeTarget = targetPlayerId;
    this.network.socket.emit('tradeRequest', { targetId: targetPlayerId });
  }

  updateCoinDisplay() {
    const el = document.getElementById('coin-display');
    if (el) el.textContent = `🪙 ${this.coins}`;
  }

  updateShopUI() {
    const shopEl = document.getElementById('shop-panel');
    if (!shopEl) return;

    shopEl.style.display = this.isOpen ? 'block' : 'none';

    if (!this.isOpen) return;

    let html = `<div class="shop-header">
      <h3>🛒 SHOP</h3>
      <span class="shop-coins">🪙 ${this.coins}</span>
      <button class="shop-close" onclick="game.shop.close()">✕</button>
    </div>`;

    for (const [category, items] of Object.entries(this.shopItems)) {
      html += `<div class="shop-category">
        <h4>${category.toUpperCase()}</h4>`;

      for (const item of items) {
        const canBuy = this.coins >= item.price;
        html += `<div class="shop-item ${canBuy ? '' : 'cant-afford'}" onclick="game.shop.buyItem('${item.id}')">
          <span class="shop-item-icon">${item.emoji}</span>
          <div class="shop-item-info">
            <span class="shop-item-name">${item.name}</span>
            <span class="shop-item-desc">${item.desc}</span>
          </div>
          <span class="shop-item-price">🪙 ${item.price}</span>
        </div>`;
      }

      html += '</div>';
    }

    const content = shopEl.querySelector('.shop-content');
    if (content) content.innerHTML = html;
  }
}