class TouchControls {
  constructor(controls) {
    this.controls = controls;
    this.enabled = false;
    this.joystickActive = false;
    this.lookActive = false;

    this.joystickOrigin = { x: 0, y: 0 };
    this.joystickCurrent = { x: 0, y: 0 };
    this.joystickId = null;

    this.lookOrigin = { x: 0, y: 0 };
    this.lookId = null;
    this.lastLook = { x: 0, y: 0 };

    this.isMobile = this.detectMobile();

    if (this.isMobile) {
      this.init();
    }
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  }

  init() {
    this.enabled = true;
    this.createUI();
    this.setupEvents();
    document.body.classList.add('mobile-mode');
  }

  createUI() {
    // Joystick area (left side)
    const joystickArea = document.createElement('div');
    joystickArea.id = 'touch-joystick-area';
    joystickArea.className = 'touch-joystick-area';
    joystickArea.innerHTML = `
      <div class="joystick-base" id="joystick-base">
        <div class="joystick-stick" id="joystick-stick"></div>
      </div>
    `;
    document.body.appendChild(joystickArea);

    // Action buttons (right side)
    const actionBtns = document.createElement('div');
    actionBtns.id = 'touch-actions';
    actionBtns.className = 'touch-actions';
    actionBtns.innerHTML = `
      <button class="touch-btn touch-btn-attack" id="touch-attack">⚔️</button>
      <button class="touch-btn touch-btn-jump" id="touch-jump">⬆️</button>
      <button class="touch-btn touch-btn-interact" id="touch-interact">🤚</button>
      <button class="touch-btn touch-btn-flashlight" id="touch-flashlight">🔦</button>
      <button class="touch-btn touch-btn-run" id="touch-run">🏃</button>
      <button class="touch-btn touch-btn-build" id="touch-build">🏠</button>
      <button class="touch-btn touch-btn-inventory" id="touch-inventory">🎒</button>
    `;
    document.body.appendChild(actionBtns);

    // Look area (right half of screen)
    const lookArea = document.createElement('div');
    lookArea.id = 'touch-look-area';
    lookArea.className = 'touch-look-area';
    document.body.appendChild(lookArea);
  }

  setupEvents() {
    const joystickArea = document.getElementById('touch-joystick-area');
    const lookArea = document.getElementById('touch-look-area');

    // Joystick
    joystickArea.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
    joystickArea.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
    joystickArea.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });

    // Look
    lookArea.addEventListener('touchstart', (e) => this.onLookStart(e), { passive: false });
    lookArea.addEventListener('touchmove', (e) => this.onLookMove(e), { passive: false });
    lookArea.addEventListener('touchend', (e) => this.onLookEnd(e), { passive: false });

    // Action buttons
    document.getElementById('touch-attack').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onAttack) this.onAttack();
    });

    document.getElementById('touch-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.controls.isJumping = true;
    });

    document.getElementById('touch-interact').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onInteract) this.onInteract();
    });

    document.getElementById('touch-flashlight').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onFlashlight) this.onFlashlight();
    });

    let runHeld = false;
    document.getElementById('touch-run').addEventListener('touchstart', (e) => {
      e.preventDefault();
      runHeld = true;
      this.controls.isRunning = true;
    });
    document.getElementById('touch-run').addEventListener('touchend', (e) => {
      e.preventDefault();
      runHeld = false;
      this.controls.isRunning = false;
    });

    document.getElementById('touch-build').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onBuild) this.onBuild();
    });

    document.getElementById('touch-inventory').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.onInventory) this.onInventory();
    });
  }

  onJoystickStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.joystickId = touch.identifier;
    this.joystickOrigin = { x: touch.clientX, y: touch.clientY };
    this.joystickActive = true;

    const base = document.getElementById('joystick-base');
    if (base) {
      base.style.left = (touch.clientX - 50) + 'px';
      base.style.top = (touch.clientY - 50) + 'px';
      base.style.opacity = '1';
    }
  }

  onJoystickMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.joystickId) {
        const dx = touch.clientX - this.joystickOrigin.x;
        const dy = touch.clientY - this.joystickOrigin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 50;
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        const nx = Math.cos(angle) * clampedDist;
        const ny = Math.sin(angle) * clampedDist;

        const stick = document.getElementById('joystick-stick');
        if (stick) {
          stick.style.transform = `translate(${nx}px, ${ny}px)`;
        }

        const threshold = 15;
        this.controls.moveForward = ny < -threshold;
        this.controls.moveBackward = ny > threshold;
        this.controls.moveLeft = nx < -threshold;
        this.controls.moveRight = nx > threshold;
      }
    }
  }

  onJoystickEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.joystickId) {
        this.joystickActive = false;
        this.joystickId = null;
        this.controls.moveForward = false;
        this.controls.moveBackward = false;
        this.controls.moveLeft = false;
        this.controls.moveRight = false;

        const stick = document.getElementById('joystick-stick');
        if (stick) stick.style.transform = 'translate(0px, 0px)';

        const base = document.getElementById('joystick-base');
        if (base) base.style.opacity = '0.5';
      }
    }
  }

  onLookStart(e) {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.lookId = touch.identifier;
    this.lastLook = { x: touch.clientX, y: touch.clientY };
    this.lookActive = true;
  }

  onLookMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.lookId) {
        const dx = touch.clientX - this.lastLook.x;
        const dy = touch.clientY - this.lastLook.y;
        this.lastLook = { x: touch.clientX, y: touch.clientY };

        // Simulate mouse movement
        this.controls.euler.y -= dx * 0.003;
        this.controls.euler.x -= dy * 0.003;
        this.controls.euler.x = Math.max(-this.controls.PI_2, Math.min(this.controls.PI_2, this.controls.euler.x));
        this.controls.camera.quaternion.setFromEuler(this.controls.euler);
      }
    }
  }

  onLookEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this.lookId) {
        this.lookActive = false;
        this.lookId = null;
      }
    }
  }
}