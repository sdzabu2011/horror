class Inventory {
  constructor() {
    this.items = [];
    this.maxSlots = 8;
    this.selectedSlot = 0;
    this.setupInput();
    this.updateUI();
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        this.selectSlot(num - 1);
      }
    });

    document.querySelectorAll('.inv-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const slotIndex = parseInt(slot.dataset.slot);
        this.selectSlot(slotIndex);
      });
    });
  }

  addItem(item) {
    if (this.items.length >= this.maxSlots) return false;
    this.items.push(item);
    this.updateUI();
    return true;
  }

  removeItem(itemId) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      if (this.selectedSlot >= this.items.length && this.selectedSlot > 0) {
        this.selectedSlot = this.items.length - 1;
      }
      this.updateUI();
      return true;
    }
    return false;
  }

  getSelectedItem() {
    if (this.selectedSlot < this.items.length) {
      return this.items[this.selectedSlot];
    }
    return null;
  }

  selectSlot(index) {
    this.selectedSlot = index;
    this.updateUI();
  }

  updateUI() {
    const slots = document.querySelectorAll('.inv-slot');

    slots.forEach((slot, index) => {
      slot.classList.remove('active', 'has-item');

      // Keep the slot number
      const numSpan = slot.querySelector('.slot-num');
      const numText = numSpan ? numSpan.outerHTML : `<span class="slot-num">${index + 1}</span>`;

      // Remove old tooltip
      const oldTooltip = slot.querySelector('.item-tooltip');
      if (oldTooltip) oldTooltip.remove();

      if (index === this.selectedSlot) {
        slot.classList.add('active');
      }

      if (this.items[index]) {
        const item = this.items[index];
        slot.classList.add('has-item');
        slot.innerHTML = numText + Helpers.getItemEmoji(item.type);

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';
        tooltip.textContent = `${item.name} (Q to use)`;
        slot.appendChild(tooltip);
      } else {
        slot.innerHTML = numText;
      }
    });
  }

  clear() {
    this.items = [];
    this.selectedSlot = 0;
    this.updateUI();
  }
}